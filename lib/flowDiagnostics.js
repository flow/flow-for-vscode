/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import {Status} from './flowStatus'

import type {DiagnosticCollection, Disposable} from 'vscode';

import {flowFindDiagnostics} from './pkg/flow-base/lib/FlowService';

let lastDiagnostics: null | DiagnosticCollection = null;
const status = new Status()

export function setupDiagnostics(disposables: Array<Disposable>): void {

	// Do an initial call to get diagnostics from the active editor if any
	if (vscode.window.activeTextEditor) {
		updateDiagnostics(vscode.window.activeTextEditor.document);
	}

	// Update diagnostics: when active text editor changes
	disposables.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		updateDiagnostics(editor && editor.document);
	}));

	// Update diagnostics when document is edited
	disposables.push(vscode.workspace.onDidSaveTextDocument(event => {
		if (vscode.window.activeTextEditor) {
			updateDiagnostics(vscode.window.activeTextEditor.document);
		}
	}));
}

async function updateDiagnostics(document) {
	status.busy()
	try {
		let diagnostics = await getDiagnostics(document)
		applyDiagnostics(diagnostics)
	} catch(error) {
		console.error(error)
	}
	status.idle()
}

async function getDiagnostics(document) {
	let diags = Object.create(null);

	if (!document) {
		return diags; // we need a document
	}

	const filePath = document.uri.fsPath;
	if (path.extname(filePath) !== '.js' && path.extname(filePath) !== '.jsx') {
		return diags; // we only check on JS files
	}

	// flowFindDiagnostics takes the provided filePath and then walks up directories
	// until a .flowconfig is found. The diagnostics are then valid for the entire
	// flow workspace.
	let rawDiag = await flowFindDiagnostics(filePath);
	if (rawDiag && rawDiag.messages) {
		const { flowRoot } = rawDiag;

		rawDiag.messages.forEach((message) => {
			const {level, messageComponents} = message
			if (!messageComponents.length) return

			const
				[baseMessage, ...other] = messageComponents,
				range = baseMessage.range;

			if (range == null) return;

			const file = path.resolve(flowRoot, range.file);

			let diag = {
				severity: level,
				startLine: range.start.line,
				startCol: range.start.column,
				endLine: range.end.line,
				endCol: range.end.column,
				msg: '',
			}

			let details = [];
			other.forEach(part => {
				let partMsg = part.descr;
				if (partMsg && partMsg !== 'null' && partMsg !== 'undefined') {
					details.push(partMsg);
				}
			});

			let msg = baseMessage.descr;
			if (details.length) {
				msg = `${msg} (${details.join(' ')})`;
			}

			diag.msg = `[flow] ${msg}`;

			if (!diags[file]) {
				diags[file] = [];
			}

			diags[file].push(diag);
		});
	}

	return diags;
}

function mapSeverity(sev: string) {
	switch (sev) {
		case "error": return vscode.DiagnosticSeverity.Error;
		case "warning": return vscode.DiagnosticSeverity.Warning;
		default: return vscode.DiagnosticSeverity.Error;
	}
}

function applyDiagnostics(diagnostics) {
	if (lastDiagnostics) {
		lastDiagnostics.dispose(); // clear old collection
	}

	// create new collection
	lastDiagnostics = vscode.languages.createDiagnosticCollection();
	for (let file in diagnostics) {
		const errors = diagnostics[file];
		const targetResource = vscode.Uri.file(file);
		const diags = errors.map(error => {
			// don't allow non-0 lines
			const startLine = Math.max(0, error.startLine - 1)
			const endLine = Math.max(0, error.endLine - 1)
			const range = new vscode.Range(startLine, error.startCol - 1, endLine, error.endCol);
			const location = new vscode.Location(targetResource, range);

			const diag =  new vscode.Diagnostic(range, error.msg, mapSeverity(error.severity));
			diag.source = 'flow'
			return diag
		})

		lastDiagnostics.set(targetResource, diags);
	}
}

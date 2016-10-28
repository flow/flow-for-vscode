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

import type {DiagnosticCollection, Disposable} from 'vscode';

import {flowFindDiagnostics} from './pkg/flow-base/lib/FlowService';

let lastDiagnostics: null | DiagnosticCollection = null;

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

function updateDiagnostics(document): void {
	getDiagnostics(document).then((diag) => applyDiagnostics(diag)).catch((error) => console.error(error.toString()));
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
		rawDiag.messages.forEach((message) => {
			const {level, messageComponents} = message
			if (!messageComponents.length) return

			const messages = [];
			const files = [];
			const description = [];

			messageComponents.forEach(message => {
				const range = message.range;

				if (message.descr && message.descr !== 'null' && message.descr !== 'undefined') {
					description.push(message.descr);
				}

				if (range == null) {
					return;
				}

				if (files.includes(range.file)) {
					return;
				}

				let diag = {
					file: range.file,
					severity: level,
					startLine: range.start.line,
					startCol: range.start.column,
					endLine: range.end.line,
					endCol: range.end.column,
					msg: '',
				}

				files.push(range.file);
				messages.push(diag);
			})

			messages.forEach(message => {
				if (!diags[message.file]) {
					diags[message.file] = [];
				}

				if (description.length > 0) {
					message.msg = description.reduce((full, descr, i, arr) => {
						if (arr.length <= 2) {
							return `${full} (${descr})`; 
						}
						
						switch (i) {
							case 1: return `${full} (${descr}`; 
							case arr.length - 1: return `${full} ${descr})`;
							default: return `${full} ${descr}`;
						}	
					});
				}

				diags[message.file].push(message);
			});
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
			const range = new vscode.Range(error.startLine - 1, error.startCol - 1, error.endLine - 1, error.endCol);
			const location = new vscode.Location(targetResource, range);

			const diag =  new vscode.Diagnostic(range, error.msg, mapSeverity(error.severity));
			diag.source = 'flow'
			return diag
		})

		lastDiagnostics.set(targetResource, diags);
	}
}

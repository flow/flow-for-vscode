/* @flow */

import * as vscode from 'vscode';
import * as path from 'path';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

let lastDiagnostics: vscode.DiagnosticCollection = null;

export function setup(disposables: Array<Function>): void {
	
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
	if (path.extname(filePath) !== '.js') {
		return diags; // we only check on JS files
	}
	
	let rawDiag = await FlowService.flowFindDiagnostics(filePath);
	if (rawDiag && rawDiag.messages) {
		rawDiag.messages.forEach((message) => {
			// Errors and Warnings in flow can have multiple positions in the editor with multiple
			// messages. We currently do not support this and instead just flatten all reported issues
			// into one (see details below)
			if (message.length > 0) {
				let diag: any = Object.create(null);
				let file = message[0].path;
				diag.startLine = message[0].line;
				diag.endLine = message[0].endline;
				diag.severity = message[0].level;
				diag.startCol = message[0].start;
				diag.endCol = message[0].end;
				
				let details = [];
				message.slice(1).forEach(part => {
					let partMsg = part.descr;
					if (partMsg && partMsg !== 'null' && partMsg !== 'undefined') {
						details.push(partMsg);
					}
				});
				
				let msg = message[0].descr;
				if (details.length) {
					msg = `${msg} (${details.join(' ')})`;
				}
				
				diag.msg = msg;
				
				if (!diags[file]) {
					diags[file] = []; 
				}
				
				diags[file].push(diag);
			}
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
		let errors = diagnostics[file];
		var targetResource = vscode.Uri.file(file);

		let diags = errors.map(error => {
			let range = new vscode.Range(error.startLine - 1, error.startCol - 1, error.endLine - 1, error.endCol);
			let location = new vscode.Location(targetResource, range);
			
			return new vscode.Diagnostic(range, error.msg, mapSeverity(error.severity));
		})

		lastDiagnostics.set(targetResource, diags);
	}
}
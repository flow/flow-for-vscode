/* @flow */

import * as vscode from 'vscode';
import * as path from 'path';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

let lastDiagnostics: vscode.DiagnosticCollection = null;

export function setup(): void {
	
	// Do an initial call to get diagnostics from the active editor if any
	if (vscode.window.activeTextEditor) {
		getDiagnostics(vscode.window.activeTextEditor.document).then((diag) => handleDiagnostics(diag)).catch((error) => console.error(error.toString()));
	}
	
	// Update diagnostics when documents change
	vscode.workspace.onDidChangeTextDocument(event => {
		getDiagnostics(event.document).then((diag) => handleDiagnostics(diag)).catch((error) => console.error(error.toString()));
	});
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
	
	let rawDiag = await FlowService.flowFindDiagnostics(filePath, document.getText());
	if (rawDiag && rawDiag.messages) {
		rawDiag.messages.forEach((message) => {
			if (message.length > 0) {
				let diag = Object.create(null);
				let file = message[0].path;
				diag.startLine = message[0].line;
				diag.endLine = message[0].endline;
				diag.severity = message[0].level;
				diag.startCol = message[0].start;
				diag.endCol = message[0].end;
				diag.msg = message.reduce((p, c) => p + " " + c.descr, "");
				
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

function handleDiagnostics(diagnostics) {
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
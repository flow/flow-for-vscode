/* @flow */

import * as vscode from 'vscode';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

export class HoverSupport {
	
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
		const fileName = document.uri.fsPath;
		const currentContents = document.getText();
		
		const wordAtPosition = document.getWordRangeAtPosition(position);
		if (wordAtPosition) {
			const line = wordAtPosition.start.line + 1; // fix offsets
			const col = wordAtPosition.start.character + 1; // fix offsets
			
			if (FlowService.flowGetType) { // TODO why would this be undefined?
				const type = await FlowService.flowGetType(
					fileName,
					currentContents,
					line,
					col
				)
				
				if (type) {
					const contents = [{ language: 'flow', value: type }];
					
					return new vscode.Hover(contents);
				}
			}
		}
		
		return null; // no definition
	}
}
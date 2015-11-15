/* @flow */

import * as vscode from 'vscode';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

export class CompletionSupport {
	triggerCharacters: Array<string>;
	constructor() {
		this.triggerCharacters = ['.'];
	}

	async provideCompletionItems(document, position, token) {
		const fileName = document.uri.fsPath;
		const currentContents = document.getText();
		const line = position.line;
		const col = position.character;
		const prefix = '.'; // TODO do better.
		const completions = await FlowService.flowGetAutocompleteSuggestions(
			fileName,
			currentContents,
			line,
			col,
			prefix,
			true,
		);
		
		if (completions) {
			return completions.map(atomCompletion => {
				const completion = new vscode.CompletionItem(atomCompletion.displayText);
				completion.kind = vscode.CompletionItemKind.Function; // TODO put a real result here
				return completion;
			});
		}
		
		return [];
	}
}
/* @flow */

import * as vscode from 'vscode';

export class CompletionSupport {
	triggerCharacters: Array<string>;
	constructor() {
		this.triggerCharacters = ['.'];
	}

	provideCompletionItems(document, position, token) {
		return new Promise((resolve, reject) => {
			console.log('getting completion');
			let completion = new vscode.CompletionItem('dummyCompletion');
			completion.kind = vscode.CompletionItemKind.Function;
			resolve([completion]);
		});
	}
}
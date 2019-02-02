/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode';
import type {
	CancellationToken,
	CompletionItemKindType,
	Position,
	TextDocument,
	SnippetString
} from 'vscode';

import {flowGetAutocompleteSuggestions} from './pkg/flow-base/lib/FlowService';

export class CompletionSupport {

	async provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
	): Promise<Array<*>> {
		const fileName = document.uri.fsPath;
		const currentContents = document.getText();
		const line = position.line;
		const col = position.character;
		const prefix = '.'; // TODO do better.
		const completions = await flowGetAutocompleteSuggestions(
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
				if (atomCompletion.description) {
					completion.detail = atomCompletion.description;
				}
				completion.kind = this.typeToKind(atomCompletion.type, atomCompletion.description);

				if (completion.kind === vscode.CompletionItemKind.Function) {
					completion.insertText = new vscode.SnippetString(atomCompletion.snippet);
				}

				return completion;
			});
		}

		return [];
	}

	typeToKind(type: string, description: string): CompletionItemKindType {
		// Possible Kinds in VS Code:
		// Method,
		// Function,
		// Constructor,
		// Field,
		// Variable,
		// Class,
		// Interface,
		// Module,
		// Property
		if (type === 'function') {
			return vscode.CompletionItemKind.Function;
		}

		if (description && description.indexOf('[class: ') >= 0) {
			return vscode.CompletionItemKind.Class;
		}

		return vscode.CompletionItemKind.Variable;
	}
}

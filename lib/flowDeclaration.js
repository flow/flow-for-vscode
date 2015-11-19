/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

export class DeclarationSupport {
	
	async provideDefinition(document:vscode.TextDocument, position:vscode.Position, token: vscode.CancellationToken) {
		const fileName = document.uri.fsPath;
		const currentContents = document.getText();
		
		const wordAtPosition = document.getWordRangeAtPosition(position);
		if (wordAtPosition) {
			const line = wordAtPosition.start.line + 1; // fix offsets
			const col = wordAtPosition.start.character + 1; // fix offsets
			
			const definition = await FlowService.flowFindDefinition(
				fileName,
				currentContents,
				line,
				col
			)
			
			if (definition) {
				const range = new vscode.Range(definition.line, definition.column, definition.line, definition.column);
				const uri = vscode.Uri.file(definition.file);					
				
				return new vscode.Location(uri, range);
			}
		}
		
		return null; // no definition
	}
}
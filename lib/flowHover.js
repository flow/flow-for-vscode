/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode'

import {flowGetType} from './pkg/flow-base/lib/FlowService'

export class HoverSupport {

	async provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<?vscode.Hover> {
		const fileName = document.uri.fsPath
		const wordPosition = document.getWordRangeAtPosition(position)
		if (!wordPosition) return
		const word = document.getText(wordPosition)
		const currentContents = document.getText()
		const line = position.line
		const col = position.character
		const completions = await flowGetType(
			fileName,
			currentContents,
			line,
			col,
			false
		)

		if (completions) {
			return new vscode.Hover([
				'[Flow]',
				{language: 'javascript', value: `${word}: ${completions.type}`}
			])
		}
	}
}

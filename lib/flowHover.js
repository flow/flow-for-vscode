/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode'

import * as FlowService from './pkg/flow-base/lib/FlowService'

export class HoverSupport {

	async provideHover(document, position, token) {
		const fileName = document.uri.fsPath
		const currentContents = document.getText()
		const line = position.line
		const col = position.character
		const completions = await FlowService.flowGetType(
			fileName,
			currentContents,
			line,
			col,
			false
		)
		
		if (completions) {
      return new vscode.Hover(completions.type)
		}
	}
}
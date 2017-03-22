/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

// Necessary to get the regenerator runtime, which transpiled async functions need
import * as _ from 'regenerator-runtime/runtime';

import * as vscode from 'vscode';

import type {ExtensionContext} from 'vscode';
import {CompletionSupport} from './flowCompletion';
import {HoverSupport} from './flowHover'
import {DeclarationSupport} from './flowDeclaration';
import {setupDiagnostics} from './flowDiagnostics';

import {checkNode, checkFlow, isFlowEnabled} from './utils'
import {clearWorkspaceCaches, findFlowConfigDir} from './pkg/flow-base/lib/FlowHelpers'

import {setupLogging} from "./flowLogging"

const languages = [
	{ language: 'javascript', scheme: 'file' },
	'javascriptreact'
]

export function activate(context: ExtensionContext): void {
	//User can disable flow for some projects that previously used flow, but it's not have actual typing
	if (!isFlowEnabled()) {
		return
	}

	findFlowConfigDir(vscode.workspace.rootPath).then(configPath => {
		if (!configPath) {
			console.log(`Not starting Flow: Could not find a .flowconfig after a backwards search from ${vscode.workspace.rootPath}.`)
			return
		}

		global.vscode = vscode

		setupLogging()
		checkNode()
		checkFlow()

		// Language features
		languages.forEach(lang => {
			context.subscriptions.push(vscode.languages.registerHoverProvider(lang, new HoverSupport));
			context.subscriptions.push(vscode.languages.registerDefinitionProvider(lang, new DeclarationSupport()));
			context.subscriptions.push(vscode.languages.registerCompletionItemProvider(lang, new CompletionSupport(), '.'));
		})
		// https://github.com/Microsoft/vscode/issues/7031 Workaround for language scoring for language and in-memory. Check in nearest Insiders build
		// context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'javascript' }, new CompletionSupport(), '.'));
		// Diagnostics
		setupDiagnostics(context);
	})
}

vscode.workspace.onDidChangeConfiguration(params => {
	clearWorkspaceCaches();
});

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

import * as diagnostics from './flowDiagnostics';

import * as FlowService from './pkg/flow-base/lib/FlowService';

import {CompletionSupport} from './flowCompletion';
import {HoverSupport} from './flowHover'
import {DeclarationSupport} from './flowDeclaration';

type Context = {
	subscriptions: Array<vscode.Disposable>
}

function configure(): void {
	vscode.languages.setLanguageConfiguration('flow', {
		indentationRules: {
			decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
			increaseIndentPattern: /^.*\{[^}"']*$/
		},
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
		comments: {
			lineComment: '//',
			blockComment: ['/*', '*/']
		},
		brackets: [
			['{', '}'],
			['[', ']'],
			['(', ')'],
		],
		__electricCharacterSupport: {
			brackets: [
				{ tokenType:'delimiter.curly.ts', open: '{', close: '}', isElectric: true },
				{ tokenType:'delimiter.square.ts', open: '[', close: ']', isElectric: true },
				{ tokenType:'delimiter.paren.ts', open: '(', close: ')', isElectric: true }
			]
		},
		__characterPairSupport: {
			autoClosingPairs: [
				{ open: '{', close: '}' },
				{ open: '[', close: ']' },
				{ open: '(', close: ')' },
				{ open: '"', close: '"', notIn: ['string'] },
				{ open: '\'', close: '\'', notIn: ['string', 'comment'] }
			]
		}
    });
}

export function activate(context: Context): void {
	global.vscode = vscode
	
	configure()
	// Language features
	context.subscriptions.push(vscode.languages.registerHoverProvider('flow', new HoverSupport));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('flow', new CompletionSupport(), '.'));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider('flow', new DeclarationSupport()));
	
	context.subscriptions.push(vscode.languages.registerHoverProvider('javascript', new HoverSupport));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('javascript', new CompletionSupport(), '.'));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider('javascript', new DeclarationSupport()));
	
	context.subscriptions.push(vscode.languages.registerHoverProvider('javascriptreact', new HoverSupport));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('javascriptreact', new CompletionSupport(), '.'));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider('javascriptreact', new DeclarationSupport()));
	
	// Diagnostics
	diagnostics.setup(context.subscriptions);
}
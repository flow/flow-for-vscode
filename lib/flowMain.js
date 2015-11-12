/* @flow */

// Necessary to get the regenerator runtime, which transpiled async functions need
import * as babelPolyfill from 'babel-polyfill';

import * as vscode from 'vscode';

import * as config from './flowConfig';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

import {CompletionSupport} from './flowCompletion';

export function activate(context): void {
	// Configure Language
	config.configure();
	
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('flow', new CompletionSupport()));
}
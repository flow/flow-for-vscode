/* @flow */

// Necessary to get the regenerator runtime, which transpiled async functions need
import * as _ from 'regenerator/runtime';

import * as vscode from 'vscode';

import * as config from './flowConfig';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

import {CompletionSupport} from './flowCompletion';
import {DeclarationSupport} from './flowDeclaration';

export function activate(context): void {
	
	// Configure Language
	config.configure();
	
	// Language features
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('flow', new CompletionSupport()));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider('flow', new DeclarationSupport()));
}
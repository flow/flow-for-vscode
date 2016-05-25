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

import * as config from './flowConfig';
import * as diagnostics from './flowDiagnostics';

import * as FlowService from 'nuclide-flow-base/lib/FlowService';

import {CompletionSupport} from './flowCompletion';
import {DeclarationSupport} from './flowDeclaration';

export function activate(context): void {
	
	// Configure Language
	config.configure();
	
	// Language features
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('flow', new CompletionSupport(), '.'));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider('flow', new DeclarationSupport()));
	
	// Diagnostics
	diagnostics.setup(context.subscriptions);
}
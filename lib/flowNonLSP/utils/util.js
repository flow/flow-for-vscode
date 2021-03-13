/* @flow */

import spawn from 'cross-spawn';
import {window, workspace, extensions, Uri} from 'vscode'
import * as path from 'path';
import type {ExtensionContext} from 'vscode'
import {
	buildSearchFlowCommand,
	getPathToFlow
} from '../pkg/flow-base/lib/FlowHelpers'
import {
	runCommand
} from '../pkg/commons-node/process';

const NODE_NOT_FOUND = '[Flow] Cannot find node in PATH. The simplest way to resolve it is install node globally'
const FLOW_NOT_FOUND = '[Flow] Cannot find flow in PATH. Try to install it by npm install flow-bin -g'

export function isFlowEnabled(): boolean {
	return workspace.getConfiguration('flow').get('enabled')
}

export function isFlowStatusEnabled():boolean {
	return workspace.getConfiguration('flow').get('showStatus')
}

export function shouldShowUncoveredCode():boolean {
	return workspace.getConfiguration('flow').get('showUncovered')
}

export function isRunOnEditEnabled():boolean {
	return workspace.getConfiguration('flow').get('runOnEdit')
}

export function shouldRunOnAllFiles():boolean {
	return workspace.getConfiguration('flow').get('runOnAllFiles')
}

export function getFileExtensions():Array<string> {
	return workspace.getConfiguration('flow').get('fileExtensions')
}

export function shouldStopFlowOnExit():boolean {
	return workspace.getConfiguration('flow').get('stopFlowOnExit')
}

export function useCodeSnippetOnFunctionSuggest():boolean {
	return workspace.getConfiguration('flow').get('useCodeSnippetOnFunctionSuggest');
}

export function getTryPath(context:ExtensionContext):string {
	return context.asAbsolutePath('./playground/try.js')
}

export function toURI(path:string):Uri {
	return Uri.file(path)
}

export function hasFlowPragma(content:string): boolean {
        if (shouldRunOnAllFiles()) return true
	return /^\s*(\/*\*+|\/\/)\s*@flow/m.test(content);
}

export function checkNode() {
	try {
		const check = spawn(process.platform === 'win32' ? 'where' : 'which', ['node'])
		let
		  flowOutput = "",
			flowOutputError = ""
		check.stdout.on('data', function (data) {
			flowOutput += data.toString();
		})
		check.stderr.on('data', function (data) {
			flowOutputError += data.toString();
		})
		check.on('exit', function (code) {
			if (code != 0) {
				window.showErrorMessage(NODE_NOT_FOUND);
			}
		})
	} catch(e) {
		window.showErrorMessage(NODE_NOT_FOUND);
	}
}

export async function checkFlow() {
	const path = await getPathToFlow()
	try {
		const {command, args} = buildSearchFlowCommand(path)
		const check = spawn(command, args)
		let
		  flowOutput = "",
			flowOutputError = ""
		check.stdout.on('data', function (data) {
			flowOutput += data.toString();
		})
		check.stderr.on('data', function (data) {
			flowOutputError += data.toString();
		})
		check.on('exit', function (code) {
			if (code != 0) {
				window.showErrorMessage(FLOW_NOT_FOUND);
			}
		})
	} catch(e) {
		window.showErrorMessage(FLOW_NOT_FOUND);
	}
}

export async function getFlowVersion(): Promise<string> {
	const flowPath = await getPathToFlow();
	const resp = await runCommand(
		flowPath,
		['version', '--json']
	).toPromise();

	const versionJson = JSON.parse(resp);
	return versionJson.semver;
}


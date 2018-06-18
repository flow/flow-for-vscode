/* @flow */

import spawn from 'cross-spawn';
import {window, workspace, extensions, Uri} from 'vscode'
import * as path from 'path';
import type {ExtensionContext} from 'vscode'
import {
	buildSearchFlowCommand,
	getPathToFlow
} from "../pkg/flow-base/lib/FlowHelpers"

const NODE_NOT_FOUND = '[Flow] Cannot find node in PATH. The simplest way to resolve it is install node globally'
const FLOW_NOT_FOUND = '[Flow] Cannot find flow in PATH. Try to install it by npm install flow-bin -g'

export function isFlowEnabled() {
	return workspace.getConfiguration('flow').get('enabled')
}

export function useLSP() {
	return workspace.getConfiguration('flow').get('useLSP')
}

export function isFlowStatusEnabled():boolean {
	return workspace.getConfiguration('flow').get('showStatus')
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

export function getTryPath(context:ExtensionContext):string {
	return context.asAbsolutePath('./playground/try.js')
}

export function toURI(path:string):Uri {
	return Uri.file(path)
}

export function hasFlowPragma(content:string) {
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

export async function checkFlow(root: ?string) {
	const path = await getPathToFlow(root)
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

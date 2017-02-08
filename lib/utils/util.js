/** @flow */

import spawn from 'cross-spawn';
import {window, workspace} from 'vscode'
import {getPathToFlow} from "../pkg/flow-base/lib/FlowHelpers"
import fsPromise from '../pkg/commons-node/fsPromise';
import path from 'path';

const NODE_NOT_FOUND = '[Flow] Cannot find node in PATH. The simpliest way to resolve it is install node globally'
const FLOW_NOT_FOUND = '[Flow] Cannot find flow in PATH. Try to install it by npm install flow-bin -g'

export function isFlowEnabled() {
	return workspace.getConfiguration('flow').get('enabled')
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
	const flowPath = await getPathToFlow()
	try {
		if (process.platform === 'win32' && path.isAbsolute(flowPath)) {
			// where does not support absolute paths
			const exists = await fsPromise.exists(flowPath);
			if (!exists) {
				throw new Error(`Flow in ${flowPath} does not exist`);
			} 
			return;
		}
		const check = spawn(process.platform === 'win32' ? 'where' : 'which', [flowPath])
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
/* @flow */

import * as vscode from 'vscode';

import * as config from './flowConfig';

function activate(context): void {
	
	// Configure Language
	config.configure();
}

exports.activate = activate;
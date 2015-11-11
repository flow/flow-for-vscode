/* @flow */

var vscode = require('vscode');
var config = require('./flowConfig');

function activate(context): void {
	
	// Configure Language
	config.configure();
}

exports.activate = activate;
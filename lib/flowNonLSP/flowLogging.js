/* @flow */
import * as vscode from 'vscode';
import getOutputChannel from './utils/getOutputChannel';

export function setupLogging(context: vscode.ExtensionContext): void {
  const channel = getOutputChannel();
  context.subscriptions.push(channel);
}

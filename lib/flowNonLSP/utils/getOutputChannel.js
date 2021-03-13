/* @flow */
import * as vscode from 'vscode';

export default function getOutputChannel(): vscode.OutputChannel {
  if (global.flowOutputChannel) {
    return global.flowOutputChannel;
  }
  const channel = vscode.window.createOutputChannel('Flow');
  vscode.commands.registerCommand('flow.show-output', () => channel.show());
  global.flowOutputChannel = channel;
  return channel;
}

/* @flow */
import * as vscode from 'vscode';
import FlowClients from './FlowClients';

export default class PluginCommands {
  _clients: FlowClients;
  _outputChannel: vscode.OutputChannel;

  _subscriptions: Array<vscode.IDisposable> = [];

  constructor(clients: FlowClients, outputChannel: vscode.OutputChannel) {
    this._clients = clients;
    this._outputChannel = outputChannel;
    this._registerCommands();
  }

  dispose() {
    this._subscriptions.forEach(item => {
      item.dispose();
    });
  }

  _registerCommands() {
    /* prettier-ignore */
    this._subscriptions.push(
      vscode.commands.registerCommand('flow.toggleCoverage', this.toggleCoverage, this),
      vscode.commands.registerCommand('flow.showStatus', this.showStatus, this),
      vscode.commands.registerCommand('flow.restartClient', this.restartClient, this),
      vscode.commands.registerCommand('flow.logClientDebugInfo', this.logClientDebugInfo, this),
      vscode.commands.registerCommand('flow.showOutputChannel', this.showOutputChannel, this),
    );
  }

  showStatus() {
    this._clients.pick('Select a client to show status').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.showStatus);
      }
    });
  }

  toggleCoverage() {
    this._clients.pick('Select a client to toggle coverage').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.toggleCoverage);
      }
    });
  }

  restartClient() {
    this._clients.pick('Select a client to restart').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.restartClient);
      }
    });
  }

  logClientDebugInfo() {
    this._clients.pick('Select a client to log debug info').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.logDebugInfo);
      }
    });
  }

  showOutputChannel() {
    this._outputChannel.show(true);
  }
}

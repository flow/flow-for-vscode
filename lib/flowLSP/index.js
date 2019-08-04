/* @flow */
import * as vscode from 'vscode';

import FlowClients from './FlowClients';

import PluginCommands from './PluginCommands';
import * as handlers from './handlers';

import Logger from './utils/Logger';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('Flow');
  const logger = new Logger('', outputChannel, 'error');
  const clients = new FlowClients(logger);
  const commands = new PluginCommands(clients, outputChannel);

  logger.info('Open javascript or flowconfig to start flow.');

  context.subscriptions.push(
    clients,
    // handlers
    vscode.workspace.onDidOpenTextDocument((document) => {
      handlers.onDidOpenTextDocument(clients, document, outputChannel, logger);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      handlers.onDidChangeActiveTextEditor(clients, editor);
    }),
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      // NOTE: as we are lazily starting flow clients
      // so no need to handle 'added' case
      if (event.removed.length > 0) {
        handlers.onDidRemoveWorkspaceFolders(clients, event.removed);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((config) => {
      if (config.affectsConfiguration('flow')) {
        handlers.onDidChangeConfiguration();
      }
    }),
    commands,
    outputChannel,
  );

  // create flow clients for currently opened documents
  vscode.workspace.textDocuments.forEach((document) => {
    handlers.onDidOpenTextDocument(clients, document, outputChannel, logger);
  });
}

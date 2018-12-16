/* @flow */
import * as path from 'path';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';
import {
  checkNode,
  checkFlow,
  isFlowEnabled,
  isRunOnEditEnabled,
  shouldStopFlowOnExit,
  isFlowStatusEnabled
} from '../utils';
import { setupLogging } from '../flowLogging';
import { clearWorkspaceCaches, getPathToFlow } from '../pkg/flow-base/lib/FlowHelpers';

import hoverMiddleware from './middlewares/hover';
import TypeCoverageFeature from './features/TypeCoverage';
import StatusFeature from './features/Status';
import StatusBarWidget from './features/StatusBarWidget';
import ignoreFlowFrequentErrors from './ignoreFlowFrequentErrors';

const languages = [
  { language: 'javascript', scheme: 'file' },
  { language: 'javascriptreact', scheme: 'file' }
];

export async function activate(context: vscode.ExtensionContext) {
  if (!isFlowEnabled()) {
    return;
  }
  global.vscode = vscode;

  setupLogging(context);
  checkNode();
  checkFlow();

  const pathToFlow = await getPathToFlow();

  const serverOptions: lsp.ServerOptions = {
    command: pathToFlow,
    args: [
      'lsp',
      ...['--from', 'vscode'],
      // auto stop flow process
      shouldStopFlowOnExit() ? '--autostop' : null
    ].filter(Boolean)
  };

  // Options to control the language client
  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: languages,
    uriConverters: {
      code2Protocol: uri => uri.toString(true), // this disables URL-encoding for file URLs
      protocol2Code: value => vscode.Uri.parse(value)
    },
    outputChannel: global.flowOutputChannel,
    middleware: {
      // using middleware to format hover content
      provideHover: hoverMiddleware
    },
    initializationOptions: {
      // [Partial 'runOnEdit' support]
      // flow lsp currently only support live syntax errors
      liveSyntaxErrors: isRunOnEditEnabled()
    }
  };

  // Create the language client and start the client.
  const client = new lsp.LanguageClient('flow', 'Flow', serverOptions, clientOptions);

  const statusBarWidget = new StatusBarWidget();
  context.subscriptions.push(statusBarWidget);

  client.registerFeature(new TypeCoverageFeature(client, statusBarWidget));
  client.registerFeature(new StatusFeature(client, statusBarWidget));
  ignoreFlowFrequentErrors(client);

  // Tell user to reload vscode if config changed
  vscode.workspace.onDidChangeConfiguration(config => {
    if (config.affectsConfiguration('flow')) {
      vscode.window
        .showInformationMessage('Flow settings changed, reload vscode to apply changes.', 'Reload')
        .then(selected => {
          if (selected === 'Reload') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
    }
  });

  context.subscriptions.push(client.start());
}

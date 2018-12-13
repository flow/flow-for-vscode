/* @flow */
'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import {
  workspace,
  window,
  Disposable,
  ExtensionContext,
  StatusBarAlignment,
  TextEditor,
} from 'vscode';
import {
  ErrorHandler,
  LanguageClient,
  LanguageClientOptions,
  SettingMonitor,
  ServerOptions,
  State as ClientState,
  TransportKind,
} from 'vscode-languageclient';
import { checkNode, checkFlow, isFlowEnabled } from './utils';
import { setupLogging } from './flowLogging';
import { clearWorkspaceCaches, getPathToFlow } from './pkg/flow-base/lib/FlowHelpers';

const languages = [
  { language: 'javascript', scheme: 'file' },
  { language: 'javascriptreact', scheme: 'file' }
];

export async function activate(context: ExtensionContext) {
  if (!isFlowEnabled()) {
    return;
  }
  global.vscode = vscode;

  setupLogging();
  checkNode();
  checkFlow();

  const pathToFlow = await getPathToFlow();
  
  const serverOptions: ServerOptions = {
    command: pathToFlow,
    args: ['lsp'],
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: languages,
    // $FlowFixMe: https://code.visualstudio.com/docs/extensionAPI/vscode-api#_workspace
    rootPath: workspace.workspaceFolders[0],
    initializationOptions:{
      
    },
    synchronize: {
      configurationSection: 'flow',
      // Notify the server about file changes to '.clientrc files contain in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/*.{js,jsx,mjs,js.flow}'),
    },
    uriConverters: {
      code2Protocol: uri => uri.toString(true), // this disables URL-encoding for file URLs
    },
  };

  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 0);
  let serverRunning: boolean = false;

  // Create the language client and start the client.
  const client = new LanguageClient(
    'flow',
    'Flow', 
    serverOptions,
    clientOptions,
  );

  const defaultErrorHandler: ErrorHandler = client.createDefaultErrorHandler();
  const running = 'Flow server is running.';
  const stopped = 'Flow server stopped.';

  client.onDidChangeState(event => {
    if (event.newState === ClientState.Running) {
      client.info(running);
      statusBarItem.tooltip = running;
      serverRunning = true;
    } else {
      client.info(stopped);
      statusBarItem.tooltip = stopped;
      serverRunning = false;
    }
    udpateStatusBarVisibility(statusBarItem, serverRunning);
  });

  const disposable = client.start();
  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);
}

function udpateStatusBarVisibility(statusBarItem, show: boolean): void {
  if (show) {
    statusBarItem.show();
    statusBarItem.text = 'Flow';
  } else {
    statusBarItem.hide();
  }
}

workspace.onDidChangeConfiguration(params => {
  clearWorkspaceCaches();
});

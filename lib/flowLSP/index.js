/* @flow */
import * as path from 'path';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';
import * as fs from 'fs-plus';
import {
  checkNode,
  checkFlow,
  getFlowVersion,
  isFlowEnabled,
  isRunOnEditEnabled,
  shouldStopFlowOnExit,
  isFlowStatusEnabled,
} from '../utils';
import { setupLogging } from '../flowLogging';
import {
  clearWorkspaceCaches,
  getPathToFlow,
} from '../pkg/flow-base/lib/FlowHelpers';
import semver from 'semver';

import hoverMiddleware from './middlewares/hover';
import TypeCoverageFeature from './features/TypeCoverage';
import StatusFeature from './features/Status';
import StatusBarWidget from './features/StatusBarWidget';

const languages = [
  { language: 'javascript', scheme: 'file' },
  { language: 'javascriptreact', scheme: 'file' },
];

export async function activate(context: vscode.ExtensionContext) {
  if (!isFlowEnabled()) {
    return;
  }

  global.vscode = vscode;
  setupLogging(context);

  // only activate plugin if .flowconfig present
  if (!(await checkFlowConfigExists())) {
    return;
  }

  // make sure flow supports lsp
  if (!(await checkFlowSupportsLSP())) {
    return;
  }

  const pathToFlow = await getPathToFlow();

  const serverOptions: lsp.ServerOptions = {
    command: pathToFlow,
    args: [
      'lsp',
      ...['--from', 'vscode'],
      // auto stop flow process
      shouldStopFlowOnExit() ? '--autostop' : null,
    ].filter(Boolean),
  };

  // Options to control the language client
  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: languages,
    revealOutputChannelOn: lsp.RevealOutputChannelOn.Never,
    uriConverters: {
      code2Protocol: uri => uri.toString(true), // this disables URL-encoding for file URLs
      protocol2Code: value => vscode.Uri.parse(value),
    },
    outputChannel: global.flowOutputChannel,
    middleware: {
      // using middleware to format hover content
      provideHover: hoverMiddleware,
    },
    initializationOptions: {
      // [Partial 'runOnEdit' support]
      // flow lsp currently only support live syntax errors
      liveSyntaxErrors: isRunOnEditEnabled(),
    },
  };

  // Create the language client and start the client.
  const client = new lsp.LanguageClient(
    'flow',
    'Flow',
    serverOptions,
    clientOptions,
  );

  const statusBarWidget = new StatusBarWidget();
  context.subscriptions.push(statusBarWidget);

  client.registerFeature(new TypeCoverageFeature(client, statusBarWidget));
  client.registerFeature(new StatusFeature(client, statusBarWidget));

  // Tell user to reload vscode if config changed
  vscode.workspace.onDidChangeConfiguration(config => {
    if (config.affectsConfiguration('flow')) {
      vscode.window
        .showInformationMessage(
          'Flow settings changed, reload vscode to apply changes.',
          'Reload',
        )
        .then(selected => {
          if (selected === 'Reload') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
    }
  });

  context.subscriptions.push(client.start());
}

async function checkFlowSupportsLSP(): Promise<boolean> {
  const version = await getFlowVersion();
  const checkVersion = '>=0.75';
  if (!semver.satisfies(version, checkVersion)) {
    const msg = `Flow version ${version} doesn't support lsp mode. Please upgrade to version ${checkVersion}.`;
    writeToOutputChannel('ERROR', msg);
    vscode.window.showErrorMessage(msg);
    return false;
  }
  return true;
}

async function checkFlowConfigExists(): Promise<boolean> {
  return new Promise(resolve => {
    const rootPath = vscode.workspace.rootPath;
    // rootPath is undefined (if only file open in vscode)
    if (!rootPath) {
      return resolve(false);
    }

    fs.exists(path.join(rootPath, '.flowconfig'), exists => {
      if (!exists) {
        writeToOutputChannel(
          'INFO',
          `Could not find a .flowconfig in rootPath '${rootPath}'`,
        );
      }
      resolve(exists);
    });
  });
}

function writeToOutputChannel(level: 'ERROR' | 'INFO', msg: string) {
  global.flowOutputChannel.appendLine(
    `[${level} - ${new Date().toLocaleTimeString()}] ${msg}`,
  );
}

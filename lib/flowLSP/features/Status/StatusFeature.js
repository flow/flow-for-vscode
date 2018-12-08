/* @flow */
// add support using "window/showStatus" lsp extension
import * as lsp from 'vscode-languageclient';
import * as vscode from 'vscode';
import Status from './Status';
import { type ShowStatusParams, LspMessageType } from './types';

type StaticFeature = lsp.StaticFeature;

export default class StatusFeature implements StaticFeature {
  _client: lsp.BaseLanguageClient;

  constructor(client: lsp.BaseLanguageClient) {
    this._client = client;
  }

  fillClientCapabilities(capabilities: lsp.ClientCapabilities): void {
    capabilities.window = capabilities.window || {};
    capabilities.window.status = { dynamicRegistration: false };
  }

  initialize(): lsp.Disposable {
    let client = this._client;
    const status = new Status();

    client.onReady().then(() => {
      client.onRequest('window/showStatus', (params: ShowStatusParams) => {
        status.update(params);

        if (params.actions && params.actions.length > 0) {
          switch (params.type) {
            case LspMessageType.Error:
              return vscode.window.showErrorMessage(
                params.message || '',
                ...params.actions
              );
            case LspMessageType.Warning:
              return vscode.window.showInformationMessage(
                params.message || '',
                ...params.actions
              );
          }
        }
      });
    });

    return status;
  }
}

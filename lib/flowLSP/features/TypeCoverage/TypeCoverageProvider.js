/* @flow */
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';
import {
  type TypeCoverageResult,
  type TypeCoverageParams,
  type ConnectionStatusParams,
} from './types';

export const TypeCoverageRequest = {
  type: new lsp.RequestType<
    TypeCoverageParams,
    TypeCoverageResult | void,
    void,
    lsp.TextDocumentRegistrationOptions,
  >('textDocument/typeCoverage'),
};

const ConnectionStatusNotification = {
  type: new lsp.NotificationType<ConnectionStatusParams, void>(
    'telemetry/connectionStatus',
  ),
};

type ConnectionStatusListener = (params: ConnectionStatusParams) => void;

export default class TypeCoverageProvider {
  _client: lsp.LanguageClient;
  _listeners: Array<ConnectionStatusListener> = [];

  constructor(client: lsp.LanguageClient) {
    this._client = client;
    this._client.onNotification(
      ConnectionStatusNotification.type,
      this._handleConnectionStatus,
    );
  }

  onConnectionStatus = (listener: ConnectionStatusListener) => {
    // TODO: option to unlisten
    this._listeners.push(listener);
  };

  provideTypeCoverage = (
    document: vscode.TextDocument,
  ): vscode.ProviderResult<TypeCoverageResult> => {
    const client = this._client;

    const params = {
      textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(
        document,
      ),
    };

    return client.sendRequest(TypeCoverageRequest.type, params).then(
      coverage => coverage,
      error => {
        client.logFailedRequest(TypeCoverageRequest.type, error);
        return Promise.resolve(null);
      },
    );
  };

  _handleConnectionStatus = (params: ConnectionStatusParams) => {
    this._listeners.forEach(listener => {
      listener(params);
    });
  };
}

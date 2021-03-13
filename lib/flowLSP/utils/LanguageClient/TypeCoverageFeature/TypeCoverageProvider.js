/* @flow */
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';
import {
  type TypeCoverageResult,
  type TypeCoverageParams,
  type ConnectionStatusParams,
} from './types';
import { type ILanguageClient } from '../types';

export const TypeCoverageRequest = {
  type: (new lsp.RequestType<
    TypeCoverageParams,
    TypeCoverageResult | void,
    void,
    lsp.TextDocumentRegistrationOptions,
  >('textDocument/typeCoverage'): lsp.RequestType<
    TypeCoverageParams,
    TypeCoverageResult | void,
    void,
    lsp.TextDocumentRegistrationOptions,
  >),
};

const ConnectionStatusNotification = {
  type: new lsp.NotificationType<ConnectionStatusParams, void>(
    'telemetry/connectionStatus',
  ),
};

type ConnectionStatusListener = (params: ConnectionStatusParams) => void;

export default class TypeCoverageProvider {
  _client: ILanguageClient;
  _listeners: Array<ConnectionStatusListener> = [];

  constructor(client: ILanguageClient) {
    this._client = client;
    this._client.onNotification(
      ConnectionStatusNotification.type,
      this._handleConnectionStatus,
    );
  }

  onConnectionStatus: (
    listener: ConnectionStatusListener,
  ) => vscode.IDisposable = (listener) => {
    this._listeners.push(listener);
    // dispose
    return {
      dispose: () => {
        const index = this._listeners.findIndex(
          (_listener) => listener === _listener,
        );
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      },
    };
  };

  provideTypeCoverage: (
    document: vscode.TextDocument,
  ) => vscode.ProviderResult<TypeCoverageResult> = (document) => {
    const { middleware } = this._client.clientOptions;
    return middleware && middleware.provideTypeCoverage
      ? middleware.provideTypeCoverage(document, this._provideTypeCoverage)
      : this._provideTypeCoverage(document);
  };

  _provideTypeCoverage: (
    document: vscode.TextDocument,
  ) => vscode.ProviderResult<TypeCoverageResult> = (document) => {
    const client = this._client;

    return client
      .sendRequest(TypeCoverageRequest.type, {
        textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(
          document,
        ),
      })
      .then(
        (coverage) => coverage,
        (error) => {
          client.logFailedRequest(TypeCoverageRequest.type, error);
          return Promise.resolve(null);
        },
      );
  };

  _handleConnectionStatus: (params: ConnectionStatusParams) => void = (
    params,
  ) => {
    this._listeners.forEach((listener) => {
      listener(params);
    });
  };
}

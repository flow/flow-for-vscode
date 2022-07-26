/* @flow */
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';
import {
  type TypeCoverageResult,
  type TypeCoverageParams,
  type ConnectionStatusParams,
} from './types';
import { type ILanguageClient } from '../types';

type TypeCoverageRequestType = lsp.RequestType<
  TypeCoverageParams,
  TypeCoverageResult | void,
  void,
  lsp.TextDocumentRegistrationOptions,
>;

export const TypeCoverageRequest = {
  type: (new lsp.RequestType<
    TypeCoverageParams,
    TypeCoverageResult | void,
    void,
    lsp.TextDocumentRegistrationOptions,
  >('textDocument/typeCoverage'): TypeCoverageRequestType),
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

  onConnectionStatus: (ConnectionStatusListener) => vscode.IDisposable = (
    listener: ConnectionStatusListener,
  ): vscode.IDisposable => {
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

  provideTypeCoverage: (vscode.TextDocument) => vscode.ProviderResult<TypeCoverageResult> = (
    document: vscode.TextDocument,
  ): vscode.ProviderResult<TypeCoverageResult> => {
    const { middleware } = this._client.clientOptions;
    return middleware && middleware.provideTypeCoverage
      ? middleware.provideTypeCoverage(document, this._provideTypeCoverage)
      : this._provideTypeCoverage(document);
  };

  _provideTypeCoverage: (vscode.TextDocument) => vscode.ProviderResult<TypeCoverageResult> = (
    document: vscode.TextDocument,
  ): vscode.ProviderResult<TypeCoverageResult> => {
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

  _handleConnectionStatus: (ConnectionStatusParams) => void = (
    params: ConnectionStatusParams,
  ) => {
    this._listeners.forEach((listener) => {
      listener(params);
    });
  };
}

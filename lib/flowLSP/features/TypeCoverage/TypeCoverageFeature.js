/* @flow */
// add support using "textDocument/typeCoverage" lsp extension

import * as lsp from 'vscode-languageclient';
import * as vscode from 'vscode';
import * as UUID from 'vscode-languageclient/lib/utils/uuid';
import StatusBarWidget from '../StatusBarWidget';

import TypeCoverage from './TypeCoverage';
import {
  type TypeCoverageParams,
  type TypeCoverageResult,
  ProvideTypeCoverageResult,
} from './types';

const TypeCoverageRequest = {
  type: new lsp.RequestType('textDocument/typeCoverage'),
};

export default class TypeCoverageFeature extends lsp.TextDocumentFeature<lsp.TextDocumentRegistrationOptions> {
  _widget: StatusBarWidget;

  constructor(client: lsp.BaseLanguageClient, widget: StatusBarWidget) {
    super(client, TypeCoverageRequest.type);
    this._widget = widget;
  }

  fillClientCapabilities(capabilities: lsp.ClientCapabilities): void {}

  initialize(
    capabilities: lsp.ServerCapabilities,
    documentSelector: lsp.DocumentSelector,
  ): void {
    if (!capabilities.typeCoverageProvider) {
      return;
    }

    this.register(this.messages, {
      id: UUID.generateUuid(),
      registerOptions: { documentSelector: documentSelector },
    });
  }

  registerLanguageProvider(
    options: lsp.TextDocumentRegistrationOptions,
  ): vscode.Disposable {
    let client = this._client;

    let provideTypeCoverage: ProvideTypeCoverageResult = document => {
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

    return new TypeCoverage(
      options.documentSelector,
      { provideTypeCoverage },
      this._widget,
    );
  }
}

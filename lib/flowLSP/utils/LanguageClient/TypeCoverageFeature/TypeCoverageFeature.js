/* @flow */
// add support using "textDocument/typeCoverage" lsp extension
import * as lsp from 'vscode-languageclient';
import * as vscode from 'vscode';
import * as UUID from 'vscode-languageclient/lib/utils/uuid';

import TypeCoverage from './TypeCoverage';
import { type ILanguageClient } from '../types';
import TypeCoverageProvider, {
  TypeCoverageRequest,
} from './TypeCoverageProvider';

export default class TypeCoverageFeature extends lsp.TextDocumentFeature<lsp.TextDocumentRegistrationOptions> {
  +_client: ILanguageClient;

  // $FlowExpectedError[cannot-implement] you can't do `interface ILanguageClient extends lsp.LanguageClient {` in types.js
  constructor(client: ILanguageClient) {
    super(client, TypeCoverageRequest.type);
    this._client = client;
  }

  fillClientCapabilities(capabilities: lsp.ClientCapabilities): void {
    capabilities.telemetry = capabilities.telemetry || {};
    capabilities.telemetry.connectionStatus = { dynamicRegistration: false };
  }

  initialize(
    capabilities: lsp.ServerCapabilities,
    documentSelector: ?lsp.DocumentSelector,
  ): void {
    if (!capabilities.typeCoverageProvider || !documentSelector) {
      return;
    }

    this.register(this.messages, {
      id: UUID.generateUuid(),
      registerOptions: { documentSelector },
    });
  }

  registerLanguageProvider(
    options: lsp.TextDocumentRegistrationOptions,
  ): vscode.IDisposable {
    const provider = new TypeCoverageProvider(this._client);
    return new TypeCoverage(
      options.documentSelector,
      provider,
      this._client.clientOptions.extensions.typeCoverage,
    );
  }
}

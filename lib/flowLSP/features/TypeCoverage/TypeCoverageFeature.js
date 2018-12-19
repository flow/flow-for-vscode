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
} from './types';
import TypeCoverageProvider, { TypeCoverageRequest } from './TypeCoverageProvider';

export default class TypeCoverageFeature extends lsp.TextDocumentFeature<lsp.TextDocumentRegistrationOptions> {
  _widget: StatusBarWidget;

  constructor(client: lsp.LanguageClient, widget: StatusBarWidget) {
    super(client, TypeCoverageRequest.type);
    this._widget = widget;
  }

  fillClientCapabilities(capabilities: lsp.ClientCapabilities): void {
    capabilities.telemetry = capabilities.telemetry || {};
    capabilities.telemetry.connectionStatus = { dynamicRegistration: false };
  }

  initialize(
    capabilities: lsp.ServerCapabilities,
    documentSelector: ?lsp.DocumentSelector,
  ): void {
    if (!capabilities.typeCoverageProvider) {
      return;
    }

    this.register(this.messages, {
      id: UUID.generateUuid(),
      registerOptions: { documentSelector: documentSelector || null },
    });
  }

  registerLanguageProvider(
    options: lsp.TextDocumentRegistrationOptions,
  ): vscode.IDisposable {
    const provider = new TypeCoverageProvider(this._client);
    return new TypeCoverage(
      options.documentSelector,
      provider,
      this._widget,
    );
  }
}

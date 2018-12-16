/* @flow */
// add support using "window/showStatus" lsp extension
import * as lsp from 'vscode-languageclient';
import * as vscode from 'vscode';
import StatusProvider from './StatusProvider';
import Status from './Status';
import { type ShowStatusParams, LspMessageType } from './types';
import StatusBarWidget from '../StatusBarWidget';

type StaticFeature = lsp.StaticFeature;

export default class StatusFeature implements StaticFeature {
  _client: lsp.LanguageClient;
  _widget: StatusBarWidget;

  constructor(client: lsp.LanguageClient, widget: StatusBarWidget) {
    this._client = client;
    this._widget = widget;
  }

  fillClientCapabilities(capabilities: lsp.ClientCapabilities): void {
    capabilities.window = capabilities.window || {};
    capabilities.window.status = { dynamicRegistration: false };
  }

  initialize(): lsp.IDisposable {
    const statusProvider = new StatusProvider(this._client);
    return new Status(statusProvider, this._widget);
  }
}

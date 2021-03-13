/* @flow */
// add support using "window/showStatus" lsp extension
import * as lsp from 'vscode-languageclient';
import StatusProvider from './StatusProvider';
import Status from './Status';
import { type ILanguageClient } from '../types';

type StaticFeature = lsp.StaticFeature;

export default class StatusFeature implements StaticFeature {
  _client: ILanguageClient;

  // $FlowExpectedError[cannot-implement] you can't do `interface ILanguageClient extends lsp.LanguageClient {` in types.js
  constructor(client: ILanguageClient) {
    this._client = client;
  }

  fillClientCapabilities(capabilities: lsp.ClientCapabilities): void {
    capabilities.window = capabilities.window || {};
    capabilities.window.status = { dynamicRegistration: false };
  }

  initialize(): lsp.IDisposable {
    const statusProvider = new StatusProvider(this._client);
    return new Status(
      statusProvider,
      this._client.clientOptions.extensions.status,
    );
  }
}

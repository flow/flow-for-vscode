/* eslint-disable no-empty-function */
/* @flow */
import {
  type ClientCapabilities,
  type DynamicFeature,
  type RPCMessageType,
} from 'vscode-languageclient';
import { type ILanguageClient } from './types';

class ConfigureCompletionSnippetSupport implements DynamicFeature<void> {
  _enableSnippetSupport: boolean;

  messages: Array<RPCMessageType> = [];

  constructor(client: ILanguageClient) {
    const { initializationOptions } = client.clientOptions;
    this._enableSnippetSupport = initializationOptions
      ? Boolean(initializationOptions.useCodeSnippetOnFunctionSuggest)
      : false;
  }

  fillClientCapabilities(capabilities: ClientCapabilities) {
    if (
      capabilities.textDocument &&
      capabilities.textDocument.completion &&
      capabilities.textDocument.completion.completionItem
    ) {
      capabilities.textDocument.completion.completionItem.snippetSupport = this._enableSnippetSupport;
    }
  }

  register() {}
  unregister() {}
  initialize() {}
  dispose() {}
}

export default ConfigureCompletionSnippetSupport;

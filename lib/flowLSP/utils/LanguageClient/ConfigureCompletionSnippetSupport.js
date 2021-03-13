/* eslint-disable no-empty-function */
/* @flow */
import * as lsp from 'vscode-languageclient';
import { type ILanguageClient } from './types';

type DynamicFeature<T> = lsp.DynamicFeature<T>;

class ConfigureCompletionSnippetSupport implements DynamicFeature<void> {
  _enableSnippetSupport: boolean;

  messages: Array<lsp.RPCMessageType> = [];

  constructor(client: ILanguageClient) {
    const { initializationOptions } = client.clientOptions;
    this._enableSnippetSupport = initializationOptions
      ? Boolean(initializationOptions.useCodeSnippetOnFunctionSuggest)
      : false;
  }

  fillClientCapabilities(capabilities: lsp.ClientCapabilities) {
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

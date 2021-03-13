/* @flow */
// Extend VscodeLanguageClient to add support for
// 1) TypeCoverage
// 2) Status
// 3) ConfigureCompletionSnippetSupport

import {
  type ServerOptions,
  type LanguageClientOptions,
  ILanguageClient,
} from './types';

import TypeCoverageFeature from './TypeCoverageFeature';
import StatusFeature from './StatusFeature';
import ConfigureCompletionSnippetSupport from './ConfigureCompletionSnippetSupport';

export default class LanguageClientEx extends ILanguageClient {
  constructor(
    id: string,
    name: string,
    serverOptions: ServerOptions,
    clientOptions: LanguageClientOptions,
    forceDebug?: boolean,
  ) {
    super(id, name, serverOptions, clientOptions, forceDebug);
    // $FlowFixMe: hack BaseLanguageClient removes extra properties from clientOptions so adding them back below
    this._clientOptions.extensions = clientOptions.extensions;
    this._registerExtraFeatures();
  }

  get clientOptions(): LanguageClientOptions {
    // $FlowFixMe: type clientOptions correctly
    return this._clientOptions;
  }

  _registerExtraFeatures() {
    this.registerFeature(new TypeCoverageFeature(this));
    this.registerFeature(new StatusFeature(this));
    this.registerFeature(new ConfigureCompletionSnippetSupport(this));
  }
}

/* @flow */
// Extend VscodeLanguageClient to add support for
// 1) TypeCoverage
// 2) Status

import { LanguageClient as VscodeLanguageClient } from 'vscode-languageclient';
import { type ServerOptions, type LanguageClientOptions } from './types';

import TypeCoverageFeature from './TypeCoverageFeature';
import StatusFeature from './StatusFeature';

export default class LanguageClientEx extends VscodeLanguageClient {
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
  }
}

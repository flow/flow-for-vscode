/* @flow */
export * from 'vscode-languageclient';

import * as lsp from 'vscode-languageclient';
import * as vscode from 'vscode';

import {
  type TypeCoverageResult,
  type TypeCoverageOptions,
  type CoverageReport,
} from './TypeCoverageFeature/types';
import { type StatusReport, type StatusOptions } from './StatusFeature/types';

export type { StatusReport, CoverageReport };

export type ProvideTypeCoverageSignature = (
  document: vscode.TextDocument,
) => vscode.ProviderResult<TypeCoverageResult>;

export type TypeCoverageMiddleware = {|
  +provideTypeCoverage?: (
    document: vscode.TextDocument,
    next: ProvideTypeCoverageSignature,
  ) => vscode.ProviderResult<TypeCoverageResult>,
|};

export type Middleware = {
  ...$Exact<lsp.Middleware>,
  ...TypeCoverageMiddleware,
};

export type LanguageClientOptions = {
  ...$Rest<
    { ...lsp.LanguageClientOptions, middleware: Middleware },
    {| middleware?: Middleware | void |},
  >,
  extensions: {
    status: StatusOptions,
    typeCoverage: TypeCoverageOptions,
  },
};

export class ILanguageClient extends lsp.LanguageClient {
  +clientOptions: LanguageClientOptions;
}

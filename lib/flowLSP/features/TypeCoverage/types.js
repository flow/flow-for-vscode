/* @flow */
import * as lsp from 'vscode-languageclient';
import * as vscode from 'vscode';

export type UncoveredRange = {
  range: vscode.Range,
  message?: string,
};

export type TypeCoverageResult = {
  coveredPercent: number,
  uncoveredRanges: Array<UncoveredRange>,
  defaultMessage: string,
};

export type TypeCoverageParams = {
  textDocument: lsp.TextDocumentIdentifier,
};

export interface TypeCoverageProvider {
  provideTypeCoverage: ProvideTypeCoverageResult;
}

export interface ProvideTypeCoverageResult {
  (document: vscode.TextDocument): vscode.ProviderResult<TypeCoverageResult>;
}

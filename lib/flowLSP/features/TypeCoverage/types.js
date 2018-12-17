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
  textDocument: lsp.ITextDocumentIdentifier,
};

export type ConnectionStatusParams = { isConnected: boolean };

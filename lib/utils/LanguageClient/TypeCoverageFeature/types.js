/* @flow */
import * as lsp from 'vscode-languageclient';
import * as vscode from 'vscode';

export type TypeCoverageParams = {
  textDocument: lsp.ITextDocumentIdentifier,
};

export type UncoveredRange = {
  range: vscode.Range,
  message?: string,
};
export type TypeCoverageResult = {
  coveredPercent: number,
  uncoveredRanges: Array<UncoveredRange>,
  defaultMessage: string,
};

export type ConnectionStatusParams = { isConnected: boolean };

export type CoverageReport = {|
  computing: boolean,
  coveredPercent: number | null,
  showingUncovered: boolean,
|};

export type TypeCoverageOptions = {|
  onChange: (coverage: CoverageReport | null) => void,
  command: string,
  diagnosticSeverity: vscode.DiagnosticSeverityType,
  defaultShowUncovered: boolean,
|};

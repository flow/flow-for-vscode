/* @flow */
import * as vscode from 'vscode';

export default function toDiagnosticSeverity(
  val: string,
  defaultVal: vscode.DiagnosticSeverityType,
): vscode.DiagnosticSeverityType {
  switch (val) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warn':
      return vscode.DiagnosticSeverity.Warning;
    case 'info':
      return vscode.DiagnosticSeverity.Information;
    default:
      return defaultVal;
  }
}

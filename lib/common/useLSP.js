/* @flow */
import * as vscode from 'vscode';

export default function useLSP(): boolean {
  return vscode.workspace.getConfiguration('flow').get('useLSP');
}

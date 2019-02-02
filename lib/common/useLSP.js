/* @flow */
import * as vscode from 'vscode';

export default function useLSP() {
  return vscode.workspace.getConfiguration('flow').get('useLSP');
}

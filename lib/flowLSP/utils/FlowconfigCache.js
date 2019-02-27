/* @flow */
import * as vscode from 'vscode';
import findDocumentFlowconfig from './findDocumentFlowconfig';

export default class FlowconfigCache {
  _cache: Map<string, null | string> = new Map();
  _flowconfigName: string;

  constructor(flowconfigName: string) {
    this._flowconfigName = flowconfigName;
  }

  async get(document: vscode.TextDocument): Promise<null | string> {
    const docPath = document.uri.fsPath;
    const val = this._cache.get(docPath);
    if (val !== undefined) {
      return Promise.resolve(val);
    }
    // compute
    const flowconfigPath = await findDocumentFlowconfig(
      this._flowconfigName,
      document,
    );
    this._cache.set(docPath, flowconfigPath);
    return flowconfigPath;
  }

  delete(document: vscode.TextDocument) {
    this._cache.delete(document.uri.fsPath);
  }
}

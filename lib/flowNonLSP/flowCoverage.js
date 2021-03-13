/* @flow */

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode';
import type { StatusBarItem } from 'vscode';
import { flowGetCoverage } from './pkg/flow-base/lib/FlowService';
import type {FlowCoverageResult} from './pkg/flow-base/lib/FlowService';
import { shouldShowUncoveredCode } from './utils/util'
import type {DiagnosticCollection, ExtensionContext, TextDocument, Uri} from 'vscode';

let lastDiagnostics: null | DiagnosticCollection = null;

type State = {
  showUncovered?: boolean,
  uri?: ?Uri
}

export class Coverage {
  coverageStatus: StatusBarItem;
  state: State;

  static createStatusBarItem(): StatusBarItem {
    const coverageStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    coverageStatus.tooltip = 'Flow type coverage. Click to toggle uncovered code';
    coverageStatus.command = 'flow.show-coverage';
    return coverageStatus;
  }

  constructor() {
    this.coverageStatus = Coverage.createStatusBarItem();
    this.state = { showUncovered: shouldShowUncoveredCode(), uri: null };

    vscode.commands.registerCommand('flow.show-coverage', () => {
      this.setState({ showUncovered: !this.state.showUncovered });
    });
  }

  setState(newState: State) {
    this.state = Object.assign({}, this.state, newState);
    this.render();
  }

  update(uri: Uri) {
    this.setState({ uri });
  }

  applyDiagnostics(coverageReport: FlowCoverageResult, uri: Uri) {
    if (lastDiagnostics) {
      lastDiagnostics.dispose();
    }

    lastDiagnostics = vscode.languages.createDiagnosticCollection();

    const { uncoveredRanges } = coverageReport;

    const diags = uncoveredRanges.map(item => {
      const range = new vscode.Range(
        item.start.line,
        item.start.column,
        item.end.line,
        item.end.column
      );

      const diag = new vscode.Diagnostic(
        range,
        'uncovered code',
        vscode.DiagnosticSeverity.Information
      );
      diag.source = 'flow coverage';
      return diag;
    });

    if (this.state.showUncovered) {
      lastDiagnostics.set(uri, diags);
    }
  }

  async render(): Promise<void | null> {
    const { uri } = this.state;
    if (!uri) {
      return null;
    }
    this.coverageStatus.show();

    try {
      const coverageReport = await flowGetCoverage(uri.fsPath);
      if (coverageReport) {
        const percentage = typeof coverageReport.percentage === 'number' &&
          coverageReport.percentage.toFixed(1);
        this.coverageStatus.text = `Flow: ${percentage.toString()}%`;
        this.applyDiagnostics(coverageReport, uri);
      }
    } catch (e) {
      this.coverageStatus.text = '';
    }
  }
}

export default Coverage;

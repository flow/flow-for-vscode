/* @flow */
import * as vscode from 'vscode';

import {
  TypeCoverageProvider,
  type TypeCoverageResult,
  type UncoveredRange
} from './types';
import { shouldShowUncoveredCode } from '../../../utils/util';

type State = {
  showUncovered: boolean,
  activeDocument: null | vscode.TextDocument,
  coverage: null | TypeCoverageResult,
  pendingRequest: null | Request
};

export default class TypeCoverage {
  static ToggleCommand = 'flow.show-coverage';

  statusBarItem: vscode.StatusBarItem;
  diagnostics: vscode.DiagnosticCollection;
  subscriptions: vscode.Disposable[] = [];
  documentSelector: vscode.DocumentSelector;
  provider: TypeCoverageProvider;

  state: State = {
    showUncovered: shouldShowUncoveredCode(),
    activeDocument: null,
    coverage: null,
    pendingRequest: null
  };

  constructor(
    documentSelector: vscode.DocumentSelector,
    provider: TypeCoverageProvider
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    this.diagnostics = vscode.languages.createDiagnosticCollection(
      'flow_coverage'
    );

    this.provider = provider;
    this.documentSelector = documentSelector;

    this.subscriptions.push(
      vscode.commands.registerCommand(TypeCoverage.ToggleCommand, () => {
        this.setState({ showUncovered: !this.state.showUncovered });
      })
    );
    this.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(document =>
        this._handleDocumentChange(document)
      )
    );
    this.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        this._handleDocumentChange(editor ? editor.document : null);
      })
    );
    if (vscode.window.activeTextEditor) {
      this._handleDocumentChange(vscode.window.activeTextEditor.document);
    }
  }

  setState(partialState: $Shape<State>) {
    this.state = {
      ...this.state,
      ...partialState
    };
    this.render();
  }

  dispose() {
    this.statusBarItem.dispose();
    this.diagnostics.dispose();
    if (this.state.pendingRequest) {
      this.state.pendingRequest.cancel();
    }
  }

  render() {
    this._renderStatusBar();
    this._renderDiagnostics();
  }

  _renderStatusBar() {
    const { state, statusBarItem } = this;

    const { coverage } = state;

    if (state.activeDocument) {
      // computing coverage for first time
      if (!coverage && state.pendingRequest) {
        statusBarItem.text = `Flow Coverage: $(sync)`;
        statusBarItem.tooltip = `Computing coverage...`;
        statusBarItem.command = '';
        statusBarItem.show();
        return;
      }

      // update covearge
      if (coverage) {
        const updating = Boolean(state.pendingRequest);
        statusBarItem.text = [
          'Flow Coverage',
          state.showUncovered ? '$(eye)' : null,
          `${coverage.coveredPercent}%`,
          updating ? '$(sync)' : null
        ]
          .filter(Boolean)
          .join(' ');

        statusBarItem.tooltip = updating
          ? 'Recomputing coverage'
          : `This file is ${coverage.coveredPercent}% covered by Flow. \n` +
            `Click to ${
              state.showUncovered ? 'hide' : 'show'
            } highlighting of uncovered areas.`;

        // disable clicking when updating coverage
        statusBarItem.command = updating ? '' : TypeCoverage.ToggleCommand;
        statusBarItem.show();

        return;
      }
    }

    statusBarItem.hide();
  }

  _renderDiagnostics() {
    const { state } = this;
    this.diagnostics.clear();
    if (!state.showUncovered || !state.activeDocument || state.pendingRequest) {
      return;
    }

    if (state.coverage && state.coverage.uncoveredRanges.length > 0) {
      const diagnostics: vscode.Diagnostic[] = state.coverage.uncoveredRanges.map(
        uncoveredRangeToDiagnostic
      );
      this.diagnostics.set(state.activeDocument.uri, diagnostics);
    }
  }

  _handleDocumentChange(document: null | vscode.TextDocument) {
    if (!document || !vscode.languages.match(this.documentSelector, document)) {
      this.setState({
        activeDocument: null,
        pendingRequest: null,
        coverage: null
      });
      return;
    }

    if (this.state.pendingRequest) {
      this.state.pendingRequest.cancel();
    }

    const pendingRequest = requestTypeCoverage(
      this.provider,
      document,
      coverage => {
        this.setState({ pendingRequest: null, coverage });
      }
    );
    this.setState({
      activeDocument: document,
      pendingRequest,
      // reset coverage when document changed
      coverage:
        this.state.activeDocument !== document ? null : this.state.coverage
    });
  }
}

type Request = {
  cancel: () => void
};

function requestTypeCoverage(
  provider: TypeCoverageProvider,
  document: vscode.TextDocument,
  callback: (coverage: null | TypeCoverageResult) => void
): Request {
  let isCancelled = false;

  Promise.resolve(provider.provideTypeCoverage(document)).then(coverage => {
    if (!isCancelled) {
      callback(coverage || null);
    }
  });

  return {
    cancel: () => {
      isCancelled = true;
    }
  };
}

function uncoveredRangeToDiagnostic(
  uncoveredRange: UncoveredRange
): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(
    uncoveredRange.range,
    uncoveredRange.message || 'Not covered by flow',
    vscode.DiagnosticSeverity.Information
  );
  diagnostic.source = 'Type Coverage';
  return diagnostic;
}

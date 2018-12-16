/* @flow */
import * as vscode from 'vscode';

import {
  TypeCoverageProvider,
  type TypeCoverageResult,
  type UncoveredRange,
} from './types';
import StatusBarWidget from '../StatusBarWidget';
import { shouldShowUncoveredCode } from '../../../utils/util';

type State = {
  showUncovered: boolean,
  activeDocument: null | vscode.TextDocument,
  coverage: null | TypeCoverageResult,
  pendingRequest: null | Request,
};

export default class TypeCoverage {
  _subscriptions: Array<vscode.Disposable> = [];
  _diagnostics: vscode.DiagnosticCollection;
  _documentSelector: vscode.DocumentSelector;
  _provider: TypeCoverageProvider;
  _widget: StatusBarWidget;

  state: State = {
    showUncovered: shouldShowUncoveredCode(),
    activeDocument: null,
    coverage: null,
    pendingRequest: null,
  };

  constructor(
    documentSelector: vscode.DocumentSelector,
    provider: TypeCoverageProvider,
    widget: StatusBarWidget,
  ) {
    this._provider = provider;
    this._documentSelector = documentSelector;
    this._widget = widget;
    this._diagnostics = vscode.languages.createDiagnosticCollection(
      'flow_coverage',
    );

    this._subscriptions.push(
      vscode.commands.registerCommand('flow.show-coverage', () => {
        this._setState({ showUncovered: !this.state.showUncovered });
      }),
      vscode.workspace.onDidSaveTextDocument(document =>
        this._handleDocumentChange(document),
      ),
      vscode.window.onDidChangeActiveTextEditor(editor => {
        this._handleDocumentChange(editor ? editor.document : null);
      }),
    );
    if (vscode.window.activeTextEditor) {
      this._handleDocumentChange(vscode.window.activeTextEditor.document);
    }
  }

  dispose() {
    this._diagnostics.dispose();
    if (this.state.pendingRequest) {
      this.state.pendingRequest.cancel();
    }
  }

  render() {
    this._renderStatusBar();
    this._renderDiagnostics();
  }

  _renderStatusBar() {
    const { state } = this;
    const { coverage } = state;

    if (state.activeDocument) {
      // computing coverage for first time
      if (!coverage && state.pendingRequest) {
        this._widget.setCoverage({
          computing: true,
          coveredPercent: null,
          showingUncovered: state.showUncovered,
        });
        return;
      }

      // update covearge
      if (coverage) {
        const computing = Boolean(state.pendingRequest);

        this._widget.setCoverage({
          computing,
          coveredPercent: coverage.coveredPercent,
          showingUncovered: state.showUncovered,
        });

        return;
      }
    }

    this._widget.setCoverage(null);
  }

  _renderDiagnostics() {
    const {
      coverage,
      showUncovered,
      activeDocument,
      pendingRequest,
    } = this.state;

    this._diagnostics.clear();
    if (!showUncovered || !activeDocument || pendingRequest) {
      return;
    }

    if (coverage && coverage.uncoveredRanges.length > 0) {
      const diagnostics: vscode.Diagnostic[] = coverage.uncoveredRanges.map(
        uncoveredRangeToDiagnostic,
      );
      this._diagnostics.set(activeDocument.uri, diagnostics);
    }
  }

  _setState(partialState: $Shape<State>) {
    this.state = {
      ...this.state,
      ...partialState,
    };
    this.render();
  }

  _handleDocumentChange(document: null | vscode.TextDocument) {
    if (
      !document ||
      !vscode.languages.match(this._documentSelector, document)
    ) {
      this._setState({
        activeDocument: null,
        pendingRequest: null,
        coverage: null,
      });
      return;
    }

    if (this.state.pendingRequest) {
      this.state.pendingRequest.cancel();
    }

    const pendingRequest = requestTypeCoverage(
      this._provider,
      document,
      coverage => {
        this._setState({ pendingRequest: null, coverage });
      },
    );

    this._setState({
      activeDocument: document,
      pendingRequest,
      // reset coverage when document changed
      coverage:
        this.state.activeDocument !== document ? null : this.state.coverage,
    });
  }
}

type Request = {
  cancel: () => void,
};

function requestTypeCoverage(
  provider: TypeCoverageProvider,
  document: vscode.TextDocument,
  callback: (coverage: null | TypeCoverageResult) => void,
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
    },
  };
}

function uncoveredRangeToDiagnostic(
  uncoveredRange: UncoveredRange,
): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(
    uncoveredRange.range,
    uncoveredRange.message || 'Not covered by flow',
    vscode.DiagnosticSeverity.Information,
  );
  diagnostic.source = 'Type Coverage';
  return diagnostic;
}

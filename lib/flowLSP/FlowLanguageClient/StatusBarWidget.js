/* @flow */
import * as vscode from 'vscode';
import Spinner from 'elegant-spinner';
import {
  type StatusReport,
  type CoverageReport,
} from '../utils/LanguageClient';

type FlowInfo = {
  path: string,
  version: string,
};

type State = {|
  flowInfo: FlowInfo,
  status: null | StatusReport,
  coverage: null | CoverageReport,
  show: boolean,
|};

type Options = {|
  clientName: string,
  flowconfig: string,
  onClickCommand: string,
|};

export default class StatusBarWidget {
  _item: vscode.StatusBarItem;
  _defaultColor: string | vscode.ThemeColor | null;
  _options: Options;

  _spinner: () => string = Spinner();
  _spinnerTimeoutID: ?TimeoutID;

  state: State = {
    status: null,
    coverage: null,
    flowInfo: { path: '', version: '' },
    show: false,
  };

  constructor(options: Options) {
    this._options = options;
    this._item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      // to render after all items
      -Number.MAX_SAFE_INTEGER,
    );
    this._defaultColor = this._item.color;
  }

  setFlowInfo(value: FlowInfo) {
    this._setState({ flowInfo: value });
  }

  getFlowInfo(): FlowInfo {
    return this.state.flowInfo;
  }

  setStatus(value: null | StatusReport) {
    this._setState({ status: value });
  }

  getStatus(): null | StatusReport {
    return this.state.status;
  }

  setCoverage(value: null | CoverageReport) {
    this._setState({ coverage: value });
  }

  render() {
    const item = this._item;
    const options = this._options;
    const { coverage, status, flowInfo, show } = this.state;

    if ((!coverage && !status) || !show) {
      item.hide();
      return;
    }

    let text = 'Flow';
    let tooltipText = '';
    let color = this._defaultColor;

    // show flow version in status widget
    if (flowInfo.version) {
      text += ` ${flowInfo.version}`;
    }

    // flow info
    tooltipText += [
      `${heading('Flow Info')}`,
      `Config = ${options.flowconfig}`,
      `Version = ${flowInfo.version}`,
      `Path = ${flowInfo.path}`,
      `ClientName = ${options.clientName}`,
    ].join('\n');

    // status text
    if (status) {
      tooltipText += `\n\n${heading('Server Status')}\n`;

      switch (status.state) {
        case 'idle':
          tooltipText += status.message;
          break;
        case 'busy':
          text += ` ${this._getSpinner()} ${status.progress}`;
          tooltipText += status.message;
          break;
        case 'error':
          text += ' $(stop)';
          tooltipText += status.message;
          color = 'red';
          break;
        default:
          break;
      }
    }

    // show coverage only if server not busy
    if (coverage && !this._isServerBusy()) {
      const { coveredPercent, computing, showingUncovered } = coverage;

      // text
      const value = [
        coveredPercent !== null ? `${coveredPercent}%` : null,
        // show sync icon is computing coverage
        computing ? `${this._getSpinner()}` : null,
        // show eye icon if showing uncovered
        showingUncovered ? '$(eye)' : null,
      ]
        .filter(Boolean)
        .join(' ');

      const showingUncoveredMsg = `Uncovered areas: ${
        showingUncovered ? 'Visible' : 'Hidden'
      }`;

      // tooltipText
      const message =
        computing || coveredPercent === null
          ? 'Computing coverage...'
          : `This file is ${coveredPercent}% covered by flow.\n${showingUncoveredMsg}`;

      text += ` ( coverage ${value} )`;
      tooltipText += `\n\n${heading('Type Coverage')}\n${message}`;
    }

    item.text = text;
    item.tooltip = tooltipText;
    item.command = options.onClickCommand;
    item.color = color;
    item.show();
  }

  show() {
    this._setState({ show: true });
  }

  hide() {
    this._setState({ show: false });
  }

  dispose() {
    this._item.dispose();
  }

  _isServerBusy(): null | boolean {
    const { status } = this.state;
    return status && status.state !== 'idle';
  }

  _getSpinner: () => string = () => {
    // using setTimeout to animate spinner
    this._clearSpinnerTimeout();
    this._spinnerTimeoutID = setTimeout(() => this.render(), 100);
    return this._spinner();
  };

  _clearSpinnerTimeout() {
    if (this._spinnerTimeoutID) {
      clearTimeout(this._spinnerTimeoutID);
      this._spinnerTimeoutID = null;
    }
  }

  _setState(partialState: $Shape<State>) {
    this.state = {
      ...this.state,
      ...partialState,
    };
    this.render();
  }
}

function heading(str) {
  return `[ ${str} ]`;
}

/* @flow */
import * as vscode from 'vscode';
import Spinner from 'elegant-spinner';

type ActionItem = {
  title: string,
  command: () => void,
};

type Status =
  | {| state: 'error', message: string |}
  | {| state: 'idle', message: string |}
  | {|
      state: 'busy',
      progress: string,
      message: string,
    |};

type Coverage = {
  computing: boolean,
  coveredPercent: number | null,
  showingUncovered: boolean,
};

type State = {
  status: null | Status,
  coverage: null | Coverage,
};

export default class StatusBarWidget {
  _item: vscode.StatusBarItem;
  _defaultColor: string | vscode.ThemeColor | null;

  _spinner = Spinner();
  _spinnerTimeoutID: ?TimeoutID;

  state: State = {
    status: null,
    coverage: null,
  };

  constructor() {
    this._item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      // to render after all items
      -Number.MAX_SAFE_INTEGER,
    );
    this._defaultColor = this._item.color;
  }

  setStatus(value: null | Status) {
    this._setState({ status: value });
  }

  setCoverage(value: null | Coverage) {
    this._setState({ coverage: value });
  }

  render() {
    const item = this._item;
    const { coverage, status } = this.state;

    if (!coverage && !status) {
      item.hide();
    }

    let text = 'Flow';
    let tooltipText = '';
    let command = '';
    let color = this._defaultColor;

    // status text
    if (status) {
      tooltipText += '[Server Status]\n';

      switch (status.state) {
        case 'idle':
          tooltipText += status.message;
          break;
        case 'busy':
          text += ` ${this._getSpinner()} ${status.progress}`;
          tooltipText += status.message;
          command = 'flow.show-status';
          break;
        case 'error':
          text += ` $(stop)`;
          tooltipText += status.message;
          color = 'red';
          command = 'flow.show-status';
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

      // tooltipText
      const message =
        computing || coveredPercent === null
          ? 'Computing coverage...'
          : `This file is ${coveredPercent}% covered by flow.\n` +
            `Click to toggle display of uncovered areas.`;

      text += ` ( coverage ${value} )`;
      tooltipText += `\n\n[Type Coverage]\n${message}`;
      command = 'flow.show-coverage';
    }

    item.text = text;
    item.tooltip = tooltipText;
    item.command = command;
    item.color = color;
    item.show();
  }

  dispose() {
    this._item.dispose();
  }

  _isServerBusy() {
    const { status } = this.state;
    return status && status.state !== 'idle';
  }

  _getSpinner = () => {
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

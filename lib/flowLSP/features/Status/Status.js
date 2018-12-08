/* @flow */
import * as vscode from 'vscode';
import { LspMessageType, type ShowStatusParams } from './types';
import Spinner from 'elegant-spinner';

type State = {
  state: 'running' | 'busy' | 'error' | null,
  message: string,
  progress: string
};

function raf(cb) {
  return setTimeout(cb, 100);
}

export default class Status {
  state: State = {
    state: null,
    message: '',
    progress: ''
  };

  statusBarItem: vscode.StatusBarItem;
  initialColor: string;
  _timeoutID: TimeoutID | null = null;
  spinner = Spinner();

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    this.statusBarItem.command = 'flow.show-output';
    this.initialColor = this.statusBarItem.color;
  }

  setState(partialState: $Shape<State>) {
    this.state = {
      ...this.state,
      ...partialState
    };
    this.render();
  }

  update(params: ShowStatusParams) {
    switch (params.type) {
      case LspMessageType.Error: {
        this.setState({
          state: 'error',
          message: params.message || '',
          progress: ''
        });
        break;
      }
      case LspMessageType.Warning: {
        let progress = '';
        if (params.shortMessage) {
          progress = params.shortMessage;
        } else if (params.progress != null) {
          const { numerator, denominator } = params.progress;
          progress =
            Math.round(
              (numerator / (denominator == null ? 100 : denominator)) * 100
            ) + '%';
        } else {
          progress = params.message || '';
        }

        this.setState({
          state: 'busy',
          message: params.message || '',
          progress
        });
        break;
      }
      case LspMessageType.Info: {
        this.setState({
          state: 'running',
          message: params.message || '',
          progress: ''
        });
        break;
      }
      default:
        this.setState({
          state: null,
          message: '',
          progress: ''
        });
    }
  }

  render() {
    const item = this.statusBarItem;
    const { state } = this;
    this._clearTimeout();

    switch (state.state) {
      case 'running':
        item.text = 'Flow';
        item.tooltip = state.message;
        item.color = this.initialColor;
        item.show();
        break;
      case 'busy':
        item.text = `Flow ${this.spinner()} ${state.progress}`;
        item.tooltip = state.message;
        item.color = this.initialColor;
        item.show();
        // to run spinner
        this._timeoutID = setTimeout(() => this.render(), 100);
        break;
      case 'error':
        item.text = '$(stop) Flow';
        item.tooltip = state.message;
        item.color = 'red';
        item.show();
        break;
      default:
        (state.state: null);
        item.hide();
    }
  }

  _clearTimeout() {
    if (this._timeoutID) {
      clearTimeout(this._timeoutID);
      this._timeoutID = null;
    }
  }

  dispose() {
    this.statusBarItem.dispose();
    this._clearTimeout();
  }
}

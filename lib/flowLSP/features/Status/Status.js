/* @flow */
import * as vscode from 'vscode';
import { LspMessageType, type StatusData } from './types';
import StatusProvider from './StatusProvider';
import StatusBarWidget from '../StatusBarWidget';

type State = {
  status: StatusData,
};

export default class Status {
  state: State = {
    status: { kind: 'null' },
  };

  _provider: StatusProvider;
  _widget: StatusBarWidget;
  _command: vscode.Disposable;

  constructor(provider: StatusProvider, widget: StatusBarWidget) {
    this._widget = widget;
    this._provider = provider;
    this._provider.onStatus(statusData => {
      this.setState({ status: statusData });
    });
    // register command to handle show current server status
    this._command = vscode.commands.registerCommand(
      'flow.show-status',
      this._handleShowStatus,
    );
  }

  setState(partialState: $Shape<State>) {
    this.state = {
      ...this.state,
      ...partialState,
    };
    this.render();
  }

  render() {
    const item = this._widget;
    const { status } = this.state;

    switch (status.kind) {
      case 'green':
        this._widget.setStatus({
          state: 'idle',
          message: status.message || '',
        });
        break;
      case 'yellow':
        this._widget.setStatus({
          state: 'busy',
          progress: this._getProgress(status),
          message: status.message || '',
        });
        break;
      case 'red':
        this._widget.setStatus({
          state: 'error',
          message: status.message || '',
        });
        break;
      case 'null':
        this._widget.setStatus(null);
      default:
        this._widget.setStatus(null);
        break;
    }
  }

  _getProgress(status: StatusData): string {
    if (status.kind !== 'yellow') {
      return '';
    }
    if (status.shortMessage != null) {
      return status.shortMessage;
    }
    if (status.progress != null) {
      const { numerator, denominator } = status.progress;
      return (
        Math.round(
          (numerator / (denominator == null ? 100 : denominator)) * 100,
        ) + '%'
      );
    }

    if (status.message != null) {
      // remove `Flow:` from message
      return status.message.replace('Flow:', '');
    }

    return '';
  }

  _handleShowStatus = () => {
    const { status } = this.state;
    switch (status.kind) {
      case 'red': {
        const items = status.buttons.map(button => ({
          title: button,
          command: () => this._provider.clickAction(status.id || '', button),
        }));
        vscode.window
          .showErrorMessage(status.message || '', ...items)
          .then(selection => {
            if (selection) {
              selection.command();
            }
          });
        break;
      }
      case 'yellow': {
        const items = status.buttons.map(button => ({
          title: button,
          command: () => this._provider.clickAction(status.id || '', button),
        }));
        vscode.window
          .showWarningMessage(status.message || '', ...items)
          .then(selection => {
            if (selection) {
              selection.command();
            }
          });
        break;
      }
      case 'green': {
        vscode.window.showInformationMessage(status.message || '');
        break;
      }
      default:
        break;
    }
  };

  dispose() {
    this._command.dispose();
  }
}

/* @flow */
import * as vscode from 'vscode';
import { type StatusData, type ActionItem, type StatusOptions } from './types';
import StatusProvider from './StatusProvider';

type State = {
  status: StatusData,
};

export default class Status {
  state: State = {
    status: { kind: 'null' },
  };

  _provider: StatusProvider;
  _options: StatusOptions;
  _subscriptions: Array<vscode.IDisposable> = [];

  constructor(provider: StatusProvider, options: StatusOptions) {
    this._options = options;
    this._provider = provider;

    this._subscriptions.push(
      this._provider.onStatus((statusData) => {
        this.setState({ status: statusData });
      }),
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
    const { status } = this.state;

    switch (status.kind) {
      case 'green':
        this._options.onChange({
          state: 'idle',
          message: status.message || '',
        });
        break;
      case 'yellow':
        this._options.onChange({
          state: 'busy',
          progress: this._getProgress(status),
          message: status.message || '',
          actions: this._createActions(status.id, status.buttons),
        });
        break;
      case 'red':
        this._options.onChange({
          state: 'error',
          message: status.message || '',
          actions: this._createActions(status.id, status.buttons),
        });
        break;
      case 'null':
        this._options.onChange(null);
        break;
      default:
        this._options.onChange(null);
    }
  }

  _createActions(
    statusID: ?string,
    statusButtons: Array<string>,
  ): Array<ActionItem> {
    return statusButtons.map<ActionItem>((button) => ({
      title: button,
      command: () => this._provider.clickAction(statusID || '', button),
    }));
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
      return `${Math.round(
        (numerator / (denominator == null ? 100 : denominator)) * 100,
      )}%`;
    }

    if (status.message != null) {
      // remove `Flow:` from message
      return status.message.replace('Flow:', '');
    }

    return '';
  }

  dispose() {
    this._subscriptions.forEach((item) => item.dispose());
  }
}

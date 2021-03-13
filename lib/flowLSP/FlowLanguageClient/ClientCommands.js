/* @flow */
import * as vscode from 'vscode';
import { type StatusReport } from '../utils/LanguageClient';
import { type ActionItem } from '../utils/LanguageClient/StatusFeature/types';

interface Client {
  getID(): string;
  getName(): string;
  restart(): void;
  getStatus(): null | StatusReport;
  logDebugInfo(): void;
}

export default class ClientCommands {
  _client: Client;
  _commands: Array<vscode.Disposable>;

  toggleCoverage: string;
  showStatus: string;
  restartClient: string;
  logDebugInfo: string;
  clientActions: string;
  showOutput: string;

  constructor(client: Client) {
    this._client = client;

    const clientID = this._client.getID();
    this.toggleCoverage = `flow.toggleCoverage.${clientID}`;
    this.showStatus = `flow.showStatus.${clientID}`;
    this.restartClient = `flow.restartClient.${clientID}`;
    this.logDebugInfo = `flow.logDebugInfo.${clientID}`;
    this.clientActions = `flow.clientActions.${clientID}`;
    this.showOutput = 'flow.showOutputChannel';

    this._registerCommands();
  }

  runRestartClientCommand() {
    vscode.commands.executeCommand(this.restartClient);
  }

  runShowStatusCommand() {
    vscode.commands.executeCommand(this.showStatus);
  }

  runShowOutputCommand() {
    vscode.commands.executeCommand(this.showOutput);
  }

  dispose() {
    this._commands.forEach((command) => command.dispose());
  }

  _registerCommands: () => void = () => {
    this._commands = [
      vscode.commands.registerCommand(this.showStatus, this._handleShowStatus),
      vscode.commands.registerCommand(this.restartClient, () =>
        this._client.restart(),
      ),
      vscode.commands.registerCommand(
        this.clientActions,
        this._handleClientActionsCommand,
      ),
      vscode.commands.registerCommand(
        this.logDebugInfo,
        this._handleLogDebugInfo,
      ),
    ];
  };

  _handleClientActionsCommand: () => null | Promise<mixed> = () => {
    const status = this._client.getStatus();
    // if server is in error state then directly run show status
    if (status && status.state === 'error') {
      this.runShowStatusCommand();
      return null;
    }

    // show user options to choose command
    const items: Array<{
      label: string,
      command: string,
    }> = [
      {
        label: 'Toggle display of uncovered areas',
        description: 'Type coverage',
        command: this.toggleCoverage,
      },
      { label: 'Show Client Status', command: this.showStatus },
      { label: 'Restart Client', command: this.restartClient },
      { label: 'Log Debug Info', command: this.logDebugInfo },
      { label: 'Show Output Channel', command: 'flow.showOutputChannel' },
    ];

    return vscode.window
      .showQuickPick(items, { placeHolder: 'Select a command to run' })
      .then((selectedItem) => {
        if (selectedItem) {
          return vscode.commands.executeCommand(selectedItem.command);
        }
        return null;
      });
  };

  _handleShowStatus: () => void = () => {
    const name = this._client.getName();
    const status = this._client.getStatus();
    if (!status) {
      return;
    }

    switch (status.state) {
      case 'error': {
        const actions = status.actions || [];

        vscode.window
          .showErrorMessage<ActionItem>(
            `[${name}] ${status.message || ''}`,
            ...actions,
          )
          .then((selection) => {
            if (selection) {
              selection.command();
            }
          });
        break;
      }
      case 'busy': {
        const actions = status.actions || [];
        vscode.window
          .showWarningMessage<ActionItem>(
            `[${name}] ${status.message || ''}`,
            ...actions,
          )
          .then((selection) => {
            if (selection) {
              selection.command();
            }
          });
        break;
      }
      case 'idle': {
        vscode.window.showInformationMessage(
          `[${name}] ${status.message || ''}`,
        );
        break;
      }
      default:
        break;
    }
  };

  _handleLogDebugInfo: () => void = () => {
    this._client.logDebugInfo();
    // open output channel
    // command inside command not running so running in next tick
    setTimeout(() => {
      this.runShowOutputCommand();
    }, 0);
  };
}

/* @flow */
import * as lsp from 'vscode-languageclient';
import {
  type ShowStatusParams,
  type StatusData,
  type MessageActionItem,
  LspMessageType,
} from './types';
import { convertToStatus, Defer } from './utils';

type StatusListener = (status: StatusData) => void;

export default class StatusProvider {
  _client: lsp.LanguageClient;

  _currentStatusID: number = 0;
  _statusActionDeferred: Defer<?string> = new Defer();
  _listeners: Array<StatusListener> = [];

  constructor(client: lsp.LanguageClient) {
    this._client = client;
    this._client.onReady().then(() => {
      this._client.onRequest(
        'window/showStatus',
        this._handleShowStatusRequest,
      );
    });
  }

  clickAction(id: string, button: string): void {
    // to ignore clicks from old status
    if (id === String(this._currentStatusID)) {
      this._statusActionDeferred.resolve(button);
    }
  }

  onStatus(listener: StatusListener) {
    // TODO: add removeListener
    this._listeners.push(listener);
  }

  _showStatus(status: StatusData) {
    this._statusActionDeferred.resolve(null);
    this._statusActionDeferred = new Defer();

    this._currentStatusID += 1;

    const statusWithId =
      status.kind !== 'red' && status.kind !== 'yellow'
        ? status
        : { ...status, id: String(this._currentStatusID) };

    this._updateStatus(statusWithId);
    return this._statusActionDeferred.promise;
  }

  _updateStatus = (status: StatusData) => {
    this._listeners.forEach(listener => {
      listener(status);
    });
  };

  _handleShowStatusRequest = (
    params: ShowStatusParams,
  ): Promise<?MessageActionItem> => {
    const actions = params.actions || [];
    const status = convertToStatus(params);
    if (!status) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this._showStatus(status)).then(response => {
      if (response === null) {
        return null;
      } else {
        const chosenAction = actions.find(action => action.title === response);
        // invariant(chosenAction != null);
        return chosenAction;
      }
    });
  };
}

/* @flow */
import * as vscode from 'vscode';
import { RequestType } from 'vscode-languageclient';
import {
  type ShowStatusParams,
  type StatusData,
  type MessageActionItem,
} from './types';
import { convertToStatus, Defer } from './utils';
import { type ILanguageClient } from '../types';

type StatusListener = (status: StatusData) => void;

const ShowStatusRequest = {
  type: new RequestType<ShowStatusParams, MessageActionItem | null, void, void>(
    'window/showStatus',
  ),
};

export default class StatusProvider {
  _client: ILanguageClient;

  _currentStatusID: number = 0;
  _statusActionDeferred: Defer<?string> = new Defer();
  _listeners: Array<StatusListener> = [];

  constructor(client: ILanguageClient) {
    this._client = client;
    this._client.onRequest(
      ShowStatusRequest.type,
      this._handleShowStatusRequest,
    );
  }

  clickAction(id: string, button: string): void {
    // to ignore clicks from old status
    if (id === String(this._currentStatusID)) {
      this._statusActionDeferred.resolve(button);
    }
  }

  onStatus(listener: StatusListener): vscode.IDisposable {
    this._listeners.push(listener);
    return {
      dispose: () => {
        const index = this._listeners.findIndex(
          (_listener) => listener === _listener,
        );
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      },
    };
  }

  _showStatus(status: StatusData): Promise<?string> {
    this._statusActionDeferred.resolve(null);
    this._statusActionDeferred = new Defer();

    this._currentStatusID += 1;

    switch (status.kind) {
      case 'red':
        this._updateStatus({
          kind: 'red',
          ...status,
          id: String(this._currentStatusID),
        });
        break;
      case 'yellow':
        this._updateStatus({
          kind: 'yellow',
          ...status,
          id: String(this._currentStatusID),
        });
        break;
      default:
        this._updateStatus(status);
    }
    return this._statusActionDeferred.promise;
  }

  _updateStatus: (status: StatusData) => void = (status) => {
    this._listeners.forEach((listener) => {
      listener(status);
    });
  };

  _handleShowStatusRequest: (
    params: ShowStatusParams,
  ) => Promise<null | MessageActionItem> = (
    params,
    // token: any,
  ): Promise<MessageActionItem | null> => {
    const actions = params.actions || [];
    const status = convertToStatus(params);
    if (!status) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this._showStatus(status)).then((response) => {
      if (response === null) {
        return null;
      }
      const chosenAction = actions.find((action) => action.title === response);
      // invariant(chosenAction != null);
      return chosenAction || null;
    });
  };
}

/* @flow */
import getOutputChannel from './getOutputChannel';
import { workspace } from 'vscode';
import Logger, { type LogLevel } from '../../common/Logger';

export function getLogLevel(): LogLevel {
  return workspace.getConfiguration('flow').get('logLevel');
}

export default function getLogger(): Logger {
  console.log(getLogLevel());
  return new Logger(
    '',
    getOutputChannel(),
    getLogLevel(),
  );
}

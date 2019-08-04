/* @flow */
import getOutputChannel from './getOutputChannel';
import { workspace } from 'vscode';
import Logger from '../../common/Logger';

export function getLogLevel() {
  return workspace.getConfiguration('flow').get('logLevel');
}

export default function getLogger() {
  console.log(getLogLevel());
  return new Logger(
    '',
    getOutputChannel(),
    getLogLevel(),
  );
}

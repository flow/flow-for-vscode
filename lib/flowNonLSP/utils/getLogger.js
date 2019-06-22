/* @flow */
import getOutputChannel from './getOutputChannel';
import Logger from '../../common/Logger';
import { getLogLevel } from './util';

export default function getLogger() {
  console.log(getLogLevel());
  return new Logger(
    '',
    getOutputChannel(),
    getLogLevel(),
  );
}

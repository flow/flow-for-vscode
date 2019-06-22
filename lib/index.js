/* @flow */
import { type ExtensionContext } from 'vscode';
import useLSP from './common/useLSP';

export function activate(context: ExtensionContext) {
  if (useLSP()) {
    // eslint-disable-next-line global-require
    require('./flowLSP').activate(context);
  } else {
    // eslint-disable-next-line global-require
    require('./flowNonLSP').activate(context);
  }
}

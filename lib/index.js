/* @flow */
import { type ExtensionContext } from 'vscode';
import useLSP from './common/useLSP';

export function activate(context: ExtensionContext) {
  if (useLSP()) {
    require('./flowLSP').activate(context);
  } else {
    require('./flowNonLSP').activate(context);
  }
}

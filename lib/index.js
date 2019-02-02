/* @flow */
import { ExtensionContext } from 'vscode';
import useLSP from './common/useLSP';

export function activate(context: ExtensionContext) {
  if (useLSP()) {
    return require('./flowLSP').activate(context);
  }
  return require('./flowNonLSP').activate(context);
}

/* @flow */
import { ExtensionContext } from 'vscode';
import { useLSP } from './utils';

export function activate(context: ExtensionContext) {
  if (useLSP()) {
    return require('./flowLSP').activate(context);
  } else {
    require('./flowMain').activate(context);
  }
}

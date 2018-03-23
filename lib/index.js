/* @flow */
import * as _ from 'regenerator-runtime/runtime'; // for async/await
import { ExtensionContext } from 'vscode';
import { useLSP } from './utils';

export function activate(context: ExtensionContext) {
  if (useLSP()) {
    require('./flowLSP').activate(context);
  } else {
    require('./flowMain').activate(context);
  }
}

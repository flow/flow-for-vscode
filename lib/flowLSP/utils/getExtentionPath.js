/* @flow */
import * as vscode from 'vscode';

const THIS_EXSTENSION_ID = 'flowtype.flow-for-vscode';

export default function getExtensionPath(): string {
  const thisExtension = vscode.extensions.getExtension(THIS_EXSTENSION_ID);
  if (!thisExtension) {
    throw new Error('Failed to find extensionPath');
  }
  return thisExtension.extensionPath;
}

/* @flow */
import { type ExtensionContext } from 'vscode';

const EXECUTION_CONTEXT_REMOTE = 2;

export default function checkRelativePatternSupported(
  context: ExtensionContext,
): boolean {
  // NOTE: vscode.RelativePattern is not working when extension run using
  // remote extension pack on windows (on linux it's working fine)
  // it's not possible to detect local maching is linux or windows
  // so disabling in all cases if extension is running remotely
  return context.executionContext !== EXECUTION_CONTEXT_REMOTE;
}

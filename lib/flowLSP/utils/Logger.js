/* @flow */
import * as vscode from 'vscode';

const LOG_LEVEL = Object.freeze({
  error: 3,
  warn: 2,
  info: 1,
  trace: 0,
});

export type LogLevel = $Keys<typeof LOG_LEVEL>;

// max of keys LOG_LEVEL
const MAX_LEVEL_LENGTH = Object.keys(LOG_LEVEL).reduce((maxLength, level) => {
  if (level.length > maxLength) {
    return level.length;
  }
  return maxLength;
}, 0);

export default class Logger {
  _outputChannel: vscode.OutputChannel;
  _level: LogLevel;
  _context: string;

  constructor(
    context: string,
    outputChannel: vscode.OutputChannel,
    level: LogLevel,
  ) {
    this._outputChannel = outputChannel;
    this._level = level;
    this._context = context;
  }

  error(message: string) {
    if (this._getLevelVal() <= LOG_LEVEL.error) {
      this._write(message, 'Error');
    }
  }

  warn(message: string) {
    if (this._getLevelVal() <= LOG_LEVEL.warn) {
      this._write(message, 'Warn');
    }
  }

  info(message: string) {
    if (this._getLevelVal() <= LOG_LEVEL.info) {
      this._write(message, 'Info');
    }
  }

  trace(message: string) {
    if (this._getLevelVal() <= LOG_LEVEL.trace) {
      this._write(message, 'Trace');
    }
  }

  _getLevelVal() {
    return LOG_LEVEL[this._level];
  }

  _write(message: string, level: string) {
    const levelStr = level.padEnd(MAX_LEVEL_LENGTH);
    const tag = [
      levelStr,
      new Date().toLocaleTimeString(),
      this._context ? this._context : null,
    ]
      .filter(Boolean)
      .join(' - ');

    this._outputChannel.appendLine(`[${tag}] ${message}`);
  }
}

/* @flow */
export default function isWindows(): boolean {
  return process.platform === 'win32';
}

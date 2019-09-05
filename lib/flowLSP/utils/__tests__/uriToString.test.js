/* @flow */
import { URI } from 'vscode-uri';
import uriToString from '../uriToString';

jest.mock('../isWindows', () => {
  return () => true;
});

test('[windows] lower-case drive letter', () => {
  const uri = URI.file('c:/flow/test');
  expect(uriToString(uri)).toEqual('file:///C:/flow/test');
});

test('[windows] upper-case drive letter', () => {
  const uri = URI.file('C:/flow/test');
  expect(uriToString(uri)).toEqual('file:///C:/flow/test');
});

test('linux path', () => {
  const uri = URI.file('/flow/test');
  expect(uriToString(uri)).toEqual('file:///flow/test');
});

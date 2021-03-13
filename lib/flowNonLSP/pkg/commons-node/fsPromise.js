/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import fs from 'fs-plus';
import mkdirpLib from 'mkdirp';
import nuclideUri from '../nuclide-remote-uri/lib/main';
import rimraf from 'rimraf';
import temp from 'temp';
import {asyncExecute} from './process';

/**
 * Create a temp directory with given prefix. The caller is responsible for cleaning up the
 *   drectory.
 * @param prefix optinal prefix for the temp directory name.
 * @return path to a temporary directory.
 */
function tempdir(prefix: string = ''): Promise<string> {
  return new Promise((resolve, reject) => {
    temp.mkdir(prefix, (err, dirPath) => {
      if (err) {
        reject(err);
      } else {
        resolve(dirPath);
      }
    });
  });
}

/**
 * @return path to a temporary file. The caller is responsible for cleaning up
 *     the file.
 */
function tempfile(options: any): Promise<string> {
  return new Promise((resolve, reject) => {
    temp.open(options, (err, info) => {
      if (err) {
        reject(err);
      } else {
        fs.close(info.fd, closeErr => {
          if (closeErr) {
            reject(closeErr);
          } else {
            resolve(info.path);
          }
        });
      }
    });
  });
}

/**
 * Searches upward through the filesystem from pathToDirectory to find a file with
 * fileName.
 * @param fileName The name of the file to find.
 * @param pathToDirectory Where to begin the search. Must be a path to a directory,
 *   not a file.
 * @return directory that contains the nearest file or null.
 */
async function findNearestFile(fileName: string, pathToDirectory: string): Promise<?string> {
  // TODO(5586355): If this becomes a bottleneck, we should consider memoizing
  // this function. The downside would be that if someone added a closer file
  // with fileName to pathToFile (or deleted the one that was cached), then we
  // would have a bug. This would probably be pretty rare, though.
  let currentPath = nuclideUri.resolve(pathToDirectory);
  do {
    const fileToFind = nuclideUri.join(currentPath, fileName);
    const hasFile = await exists(fileToFind);
    if (hasFile) {
      return currentPath;
    }
    if (nuclideUri.isRoot(currentPath)) {
      return null;
    }
    currentPath = nuclideUri.dirname(currentPath);
  } while (true);
}

/**
 * Searches upward through the filesystem from pathToDirectory to find the furthest
 * file with fileName.
 * @param fileName The name of the file to find.
 * @param pathToDirectory Where to begin the search. Must be a path to a directory,
 *   not a file.
 * @param stopOnMissing Stop searching when we reach a directory without fileName.
 * @return directory that contains the furthest file or null.
 */
async function findFurthestFile(
  fileName: string,
  pathToDirectory: string,
  stopOnMissing: boolean = false,
): Promise<?string> {
  let currentPath = nuclideUri.resolve(pathToDirectory);
  let result = null;
  do {
    const fileToFind = nuclideUri.join(currentPath, fileName);
    const hasFile = await exists(fileToFind);
    if ((!hasFile && stopOnMissing) || nuclideUri.isRoot(currentPath)) {
      return result;
    } else if (hasFile) {
      result = currentPath;
    }
    currentPath = nuclideUri.dirname(currentPath);
  } while (true);
}

function getCommonAncestorDirectory(filePaths: Array<string>): string {
  let commonDirectoryPath = nuclideUri.dirname(filePaths[0]);
  while (filePaths.some(filePath => !filePath.startsWith(commonDirectoryPath))) {
    commonDirectoryPath = nuclideUri.dirname(commonDirectoryPath);
  }
  return commonDirectoryPath;
}


function exists(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.exists(filePath, resolve);
  });
}

/**
 * Runs the equivalent of `mkdir -p` with the given path.
 *
 * Like most implementations of mkdirp, if it fails, it is possible that
 * directories were created for some prefix of the given path.
 * @return true if the path was created; false if it already existed.
 */
async function mkdirp(filePath: string): Promise<boolean> {
  const isExistingDirectory = await exists(filePath);
  if (isExistingDirectory) {
    return false;
  } else {
    return new Promise((resolve, reject) => {
      mkdirpLib(filePath, err => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
}

/**
 * Removes directories even if they are non-empty. Does not fail if the directory doesn't exist.
 */
async function rmdir(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    rimraf(filePath, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/** @return true only if we are sure directoryPath is on NFS. */
async function isNfs(entityPath: string): Promise<boolean> {
  if (process.platform === 'linux' || process.platform === 'darwin') {
    const {stdout, exitCode} = await asyncExecute('stat', ['-f', '-L', '-c', '%T', entityPath]);
    if (exitCode === 0) {
      return stdout.trim() === 'nfs';
    } else {
      return false;
    }
  } else {
    // TODO Handle other platforms (windows?): t9917576.
    return false;
  }
}

/**
 * Takes a method from Node's fs module and returns a "denodeified" equivalent, i.e., an adapter
 * with the same functionality, but returns a Promise rather than taking a callback. This isn't
 * quite as efficient as Q's implementation of denodeify, but it's considerably less code.
 */
function _denodeifyFsMethod(methodName: string): () => Promise<any> {
  return function(...args): Promise<any> {
    const method = fs[methodName];
    return new Promise((resolve, reject) => {
      method.apply(fs, args.concat([
        (err, result) => (err ? reject(err) : resolve(result)),
      ]));
    });
  };
}

export default {
  tempdir,
  tempfile,
  findNearestFile,
  findFurthestFile,
  getCommonAncestorDirectory,
  exists,
  mkdirp,
  rmdir,
  isNfs,

  copy: (_denodeifyFsMethod('copy'): () => Promise<any>),
  chmod: (_denodeifyFsMethod('chmod'): () => Promise<any>),
  lstat: (_denodeifyFsMethod('lstat'): () => Promise<any>),
  mkdir: (_denodeifyFsMethod('mkdir'): () => Promise<any>),
  readdir: (_denodeifyFsMethod('readdir'): () => Promise<any>),
  readFile: (_denodeifyFsMethod('readFile'): () => Promise<any>),
  readlink: (_denodeifyFsMethod('readlink'): () => Promise<any>),
  realpath: (_denodeifyFsMethod('realpath'): () => Promise<any>),
  rename: (_denodeifyFsMethod('rename'): () => Promise<any>),
  move: (_denodeifyFsMethod('move'): () => Promise<any>),
  stat: (_denodeifyFsMethod('stat'): () => Promise<any>),
  symlink: (_denodeifyFsMethod('symlink'): () => Promise<any>),
  unlink: (_denodeifyFsMethod('unlink'): () => Promise<any>),
  writeFile: (_denodeifyFsMethod('writeFile'): () => Promise<any>),
};

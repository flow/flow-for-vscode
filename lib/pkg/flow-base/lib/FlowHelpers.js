'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {LRUCache} from 'lru-cache';

import type {FlowLocNoSource} from './flowOutputTypes';

import nuclideUri from '../../nuclide-remote-uri/lib/main';
import {checkOutput} from '../../commons-node/process';
import fsPromise from '../../commons-node/fsPromise';
import LRU from 'lru-cache';
import invariant from 'assert';

import {getLogger} from '../../nuclide-logging/lib/main';
const logger = getLogger();

const flowConfigDirCache: LRUCache<string, Promise<?string>> = LRU({
  max: 10,
  maxAge: 1000 * 30, //30 seconds
});
const flowPathCache: LRUCache<string, boolean> = LRU({
  max: 10,
  maxAge: 1000 * 30, // 30 seconds
});

function insertAutocompleteToken(contents: string, line: number, col: number): string {
  const lines = contents.split('\n');
  let theLine = lines[line];
  theLine = theLine.substring(0, col) + 'AUTO332' + theLine.substring(col);
  lines[line] = theLine;
  return lines.join('\n');
}

/**
 * Takes an autocomplete item from Flow and returns a valid autocomplete-plus
 * response, as documented here:
 * https://github.com/atom/autocomplete-plus/wiki/Provider-API
 */
function processAutocompleteItem(replacementPrefix: string, flowItem: Object): Object {
  // Truncate long types for readability
  const description = flowItem.type.length < 80
    ? flowItem.type
    : flowItem.type.substring(0, 80) + ' ...';
  let result = {
    description,
    displayText: flowItem.name,
    replacementPrefix,
  };
  const funcDetails = flowItem.func_details;
  if (funcDetails) {
    // The parameters in human-readable form for use on the right label.
    const rightParamStrings = funcDetails.params
      .map(param => `${param.name}: ${param.type}`);
    const snippetString = getSnippetString(funcDetails.params.map(param => param.name));
    result = {
      ...result,
      leftLabel: funcDetails.return_type,
      rightLabel: `(${rightParamStrings.join(', ')})`,
      snippet: `${flowItem.name}(${snippetString})`,
      type: 'function',
    };
  } else {
    result = {
      ...result,
      rightLabel: flowItem.type,
      text: flowItem.name,
    };
  }
  return result;
}

function getSnippetString(paramNames: Array<string>): string {
  const groupedParams = groupParamNames(paramNames);
  // The parameters turned into snippet strings.
  const snippetParamStrings = groupedParams
    .map(params => params.join(', '))
    .map((param, i) => `\${${i + 1}:${param}}`);
  return snippetParamStrings.join(', ');
}

/**
 * Group the parameter names so that all of the trailing optional parameters are together with the
 * last non-optional parameter. That makes it easy to ignore the optional parameters, since they
 * will be selected along with the last non-optional parameter and you can just type to overwrite
 * them.
 */
function groupParamNames(paramNames: Array<string>): Array<Array<string>> {
  // Split the parameters into two groups -- all of the trailing optional paramaters, and the rest
  // of the parameters. Trailing optional means all optional parameters that have only optional
  // parameters after them.
  const [ordinaryParams, trailingOptional] =
    paramNames.reduceRight(([ordinary, optional], param) => {
      // If there have only been optional params so far, and this one is optional, add it to the
      // list of trailing optional params.
      if (isOptional(param) && ordinary.length === 0) {
        optional.unshift(param);
      } else {
        ordinary.unshift(param);
      }
      return [ordinary, optional];
    },
    [[], []]
  );

  const groupedParams = ordinaryParams.map(param => [param]);
  const lastParam = groupedParams[groupedParams.length - 1];
  if (lastParam != null) {
    lastParam.push(...trailingOptional);
  } else if (trailingOptional.length > 0) {
    groupedParams.push(trailingOptional);
  }

  return groupedParams;
}

function isOptional(param: string): boolean {
  invariant(param.length > 0);
  const lastChar = param[param.length - 1];
  return lastChar === '?';
}

function clearWorkspaceCaches() {
  flowPathCache.reset();
  flowConfigDirCache.reset();
  global.cachedPathToFlowBin = undefined;
}

async function isFlowInstalled(): Promise<boolean> {
  const flowPath = await getPathToFlow();
  if (!flowPathCache.has(flowPath)) {
    flowPathCache.set(flowPath, await canFindFlow(flowPath));
  }

  return flowPathCache.get(flowPath);
}

async function canFindFlow(flowPath: string): Promise<boolean> {
  try {
    // https://github.com/facebook/nuclide/issues/561
    const {command, args} = buildSearchFlowCommand(flowPath)
    await checkOutput(command, args);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * @return The path to Flow on the user's machine. First using the the user's 
 *   config, then looking into the node_modules for the project.
 * 
 *   It is cached, so it is expected that changing the users settings will 
 *   trigger a call to `clearWorkspaceCaches`.
 */

async function getPathToFlow(): Promise<string> {
  if (!global.cachedPathToFlowBin) {
    const config = global.vscode.workspace.getConfiguration('flow');
    const shouldUseNodeModule = config.get('useNPMPackagedFlow');
    const userPath = config.get('pathToFlow');

    if (shouldUseNodeModule && await canFindFlow(nodeModuleFlowLocation())){
      global.cachedPathToFlowBin = nodeModuleFlowLocation();
    } else if (await canFindFlow(userPath)) {
      global.cachedPathToFlowBin = userPath;
    } else {
      global.cachedPathToFlowBin = "flow";
    }

    logger.info("Path to Flow: " + global.cachedPathToFlowBin);
   }

  return global.cachedPathToFlowBin
}

/**
 * @return The potential path to Flow on the user's machine if they are using NPM/Yarn to manage
 * their installs of flow.
 */
function nodeModuleFlowLocation(): string {
  if (process.platform === 'win32') {
    return `${global.vscode.workspace.rootPath}\\node_modules\\.bin\\flow.cmd`
  } else {
    return `${global.vscode.workspace.rootPath}/node_modules/.bin/flow`
  }
}

/**
 * @return The command and arguments used to test the presence of flow according to platform.
 */
function buildSearchFlowCommand(testPath: string): {command: string, args: Array<string>} {
  if (process.platform !== 'win32') {
    return {
      command: 'which',
      args: [testPath]
    }
  } else {
    const splitCharLocation = testPath.lastIndexOf('\\')
    const command = testPath.substring(splitCharLocation+1, testPath.length)
    const searchDirectory = testPath.substring(0, splitCharLocation)
    const args = !searchDirectory ? [command] : ['/r', searchDirectory, command]
    return {
      command: `${process.env.SYSTEMROOT || 'C:\\Windows'}\\System32\\where`,
      args: args
    }
  }
}

function getStopFlowOnExit(): boolean {
  // $UPFixMe: This should use nuclide-features-config
  // Does not currently do so because this is an npm module that may run on the server.
  if (global.vscode) {
    return global.vscode.workspace.getConfiguration('flow').get('stopFlowOnExit')
  }
  return true;
}

function findFlowConfigDir(localFile: string): Promise<?string> {
  if (!flowConfigDirCache.has(localFile)) {
    const flowConfigDir = fsPromise.findNearestFile('.flowconfig', nuclideUri.dirname(localFile));
    flowConfigDirCache.set(localFile, flowConfigDir);
  }
  return flowConfigDirCache.get(localFile);
}

function flowCoordsToAtomCoords(flowCoords: FlowLocNoSource): FlowLocNoSource {
  return {
    start: {
      line: flowCoords.start.line - 1,
      column: flowCoords.start.column - 1,
    },
    end: {
      line: flowCoords.end.line - 1,
      // Yes, this is inconsistent. Yes, it works as expected in practice.
      column: flowCoords.end.column,
    },
  };
}

module.exports = {
  buildSearchFlowCommand,
  findFlowConfigDir,
  getPathToFlow,
  getStopFlowOnExit,
  insertAutocompleteToken,
  isFlowInstalled,
  processAutocompleteItem,
  groupParamNames,
  flowCoordsToAtomCoords,
  clearWorkspaceCaches
};

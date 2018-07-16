'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Observable} from 'rxjs';

import type {NuclideUri} from '../../nuclide-remote-uri/lib/main';

// Diagnostic information, returned from findDiagnostics.
export type Diagnostics = {
  // The location of the .flowconfig where these messages came from.
  flowRoot: NuclideUri;
  messages: Array<Diagnostic>;
};

/*
 * Each error or warning can consist of any number of different messages from
 * Flow to help explain the problem and point to different locations that may be
 * of interest.
 */
export type Diagnostic = {
  level: string;
  messageComponents: Array<MessageComponent>;
};

export type MessageComponent = {
  descr: string;
  range: ?Range;
};

export type Range = {
  file: NuclideUri;
  start: Point;
  end: Point;
};

export type Point = {
  line: number;
  column: number;
};

export type Loc = {
  file: NuclideUri;
  point: Point;
};

// If types are added here, make sure to also add them to FlowConstants.js. This needs to be the
// canonical type definition so that we can use these in the service framework.
export type ServerStatusType =
  'failed' |
  'unknown' |
  'not running' |
  'not installed' |
  'busy' |
  'init' |
  'ready';

export type ServerStatusUpdate = {
  pathToRoot: NuclideUri;
  status: ServerStatusType;
};

export type FlowOutlineTree = {
  representativeName: string;
  nodeType: FlowNodeType,
  children: Array<FlowOutlineTree>;
  startPosition: Point;
  endPosition: Point;
};

export type FlowNodeType
  = 'type'
  | 'class'
  | 'function'
  | 'constructor'
  | 'method'
  | 'property'
  | 'constant'
  | 'variable'
  | 'module'
  | null

export type FlowCoverageResult = {
  percentage: number;
  uncoveredRanges: Array<{
    start: Point;
    end: Point;
  }>;
};

import {FlowRoot} from './FlowRoot';

import {FlowRootContainer} from './FlowRootContainer';
let rootContainer: ?FlowRootContainer = null;

function getRootContainer(): FlowRootContainer {
  if (rootContainer == null) {
    rootContainer = new FlowRootContainer();
  }
  return rootContainer;
}

export function dispose(): void {
  if (rootContainer != null) {
    rootContainer.dispose();
    rootContainer = null;
  }
}

export function getServerStatusUpdates(): Observable<ServerStatusUpdate> {
  return getRootContainer().getServerStatusUpdates();
}

export function flowFindDefinition(
  file: NuclideUri,
  currentContents: string,
  line: number,
  column: number,
): Promise<?Loc> {
  return getRootContainer().runWithRoot(
    file,
    root => root.flowFindDefinition(
      file,
      currentContents,
      line,
      column,
    )
  );
}

export function flowFindDiagnostics(
  file: NuclideUri,
  currentContents: ?string,
): Promise<?Diagnostics> {
  return getRootContainer().runWithRoot(
    file,
    root => root.flowFindDiagnostics(
      file,
      currentContents,
    )
  );
}

export function flowGetAutocompleteSuggestions(
  file: NuclideUri,
  currentContents: string,
  line: number,
  column: number,
  prefix: string,
  activatedManually: boolean,
): Promise<any> {
  return getRootContainer().runWithRoot(
    file,
    root => root.flowGetAutocompleteSuggestions(
      file,
      currentContents,
      line,
      column,
      prefix,
      activatedManually,
    )
  );
}

export async function flowGetType(
  file: NuclideUri,
  currentContents: string,
  line: number,
  column: number,
  includeRawType: boolean,
): Promise<?{type: string; rawType: ?string}> {
  return getRootContainer().runWithRoot(
    file,
    root => root.flowGetType(
      file,
      currentContents,
      line,
      column,
      includeRawType,
    )
  );
}

export async function flowGetCoverage(
  file: NuclideUri,
): Promise<?FlowCoverageResult> {
  return getRootContainer().runWithRoot(
    file,
    root => root.flowGetCoverage(file),
  );
}

export function flowGetOutline(
  currentContents: string,
): Promise<?Array<FlowOutlineTree>> {
  return FlowRoot.flowGetOutline(currentContents);
}

export function allowServerRestart(): void {
  for (const root of getRootContainer().getAllRoots()) {
    root.allowServerRestart();
  }
}

/* @flow */
import path from 'path';
import getExtensionPath from './getExtentionPath';
import which from './which';
import Logger from './Logger';
import importFresh from './importFresh';

type Params = {|
  pathToFlow: string,
  flowconfigDir: string,
  workspaceRoot: string,
  useNPMPackagedFlow: boolean,
  useBundledFlow: boolean,
  logger: Logger,
|};

export default async function getFlowPath({
  pathToFlow,
  flowconfigDir,
  workspaceRoot,
  useNPMPackagedFlow,
  useBundledFlow,
  logger,
}: Params): Promise<string> {
  // 1) find using `npmPackagedFlow`
  if (useNPMPackagedFlow) {
    try {
      const flowPath = getNpmPackagedFlow(flowconfigDir, workspaceRoot, logger);
      logger.info('Found flow using option `useNPMPackagedFlow`');
      return flowPath;
    } catch (err) {
      logger.error(
        `Error loading flow using option 'useNPMPackagedFlow'\n${err.message}`,
      );
    }
  }

  // 2) find using pathToFlow
  try {
    const flowPath = await getCommandFlowPath(
      normalizePathToFlow(pathToFlow, { flowconfigDir, workspaceRoot }),
      logger,
    );
    logger.info('Found flow using option `pathToFlow`');
    return flowPath;
  } catch (err) {
    logger.error(
      `Error loading flow using option 'pathToFlow'\n${err.message}`,
    );
  }

  // 3) if nothing works fallback to bundled flow
  if (useBundledFlow) {
    try {
      const flowPath = getBundledFlowPath();
      logger.info('Falling back to bundled flow.');
      return flowPath;
    } catch (err) {
      logger.error(`Failed to load bundled flow.\n${err.message}`);
    }
  }

  throw new Error('Flow not found');
}

function getNpmPackagedFlow(
  flowconfigDir: string,
  workspaceRoot: string,
  logger: Logger,
): string {
  const dirsToCheck = [
    // a) check in flowconfig dir
    flowconfigDir,
    // b) check in workspaceRoot (ignore if flowconfigDir and workspaceRoot same)
    flowconfigDir !== workspaceRoot ? workspaceRoot : null,
  ].filter(Boolean);

  for (let i = 0; i < dirsToCheck.length; i += 1) {
    const flowPath = getFlowBinPath(dirsToCheck[i], logger);
    if (flowPath) {
      return flowPath;
    }
  }

  throw new Error(`Pkg flow-bin not found in ${dirsToCheck.join(', ')}`);
}

async function getCommandFlowPath(
  command: string,
  logger: Logger,
): Promise<string> {
  logger.trace(`Checking '${command}'`);
  const flowPath = await which(command);
  if (!flowPath) {
    throw new Error(`'${command}' not found`);
  }
  return flowPath;
}

function getBundledFlowPath(): string {
  const extensionPath = getExtensionPath();
  // NOTE: 'vsce package' never bundles node_modules/.bin folder
  // (see: https://github.com/Microsoft/vscode/issues/53916)
  // so require module instead of using node_moudles/.bin
  const bundledFlowModulePath = path.join(
    extensionPath,
    'node_modules',
    'flow-bin',
  );
  return importFresh(bundledFlowModulePath);
}

function getFlowBinPath(cwd: string, logger: Logger): null | string {
  logger.trace(`Checking flow-bin in '${cwd}`);
  const flowBinModulePath = path.join(cwd, 'node_modules', 'flow-bin');
  try {
    // user can change version of module or remove module while plugin is running
    // so always importFresh
    return importFresh(flowBinModulePath);
  } catch (err) {
    logger.trace(`Error loading flow-bin from '${cwd}'\n${err.message}`);
  }
  return null;
}

function normalizePathToFlow(
  val: string,
  vars: { flowconfigDir: string, workspaceRoot: string },
): string {
  return path.normalize(
    val
      // eslint-disable-next-line no-template-curly-in-string
      .replace('${workspaceFolder}', vars.workspaceRoot)
      // eslint-disable-next-line no-template-curly-in-string
      .replace('${flowconfigDir}', vars.flowconfigDir),
  );
}

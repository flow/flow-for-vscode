/* @flow */
import path from 'path';
import fs from 'fs-plus';

export default async function findFlowconfig(
  flowconfigName: string,
  startDir: string,
  endDir: string,
): Promise<null | string> {
  const dir = path.resolve(startDir);
  const configPath = path.join(dir, flowconfigName);

  const found = await checkFileExists(configPath);
  if (found) {
    return configPath;
  }

  if (dir === endDir) {
    return null;
  }

  return findFlowconfig(flowconfigName, path.dirname(dir), endDir);
}

function checkFileExists(filepath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(filepath, err => {
      resolve(!err);
    });
  });
}

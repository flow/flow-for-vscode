/* @flow */
import clearModule from 'clear-module';

// NOTE: I am not using "import-fresh" or any similar package from npm
// as most of them only clear entry file from cache before importing
// in our use case we are using importFresh (for now) to load flow-bin node_module
// which internally requires package.json file to load version.

export default function importFresh(moduleId: string) {
  Object.keys(require.cache).forEach(filePath => {
    if (filePath.startsWith(moduleId)) {
      clearModule(filePath);
    }
  });
  return require(moduleId);
}

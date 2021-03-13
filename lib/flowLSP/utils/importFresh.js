/* @flow */
// NOTE: I am not using "import-fresh" or any similar package from npm
// as most of them only clear entry file from cache before importing
// in our use case we are using importFresh (for now) to load flow-bin node_module
// which internally requires package.json file to load version.

export default function importFresh(moduleId: string): any {
  Object.keys(require.cache).forEach((filePath) => {
    if (filePath.startsWith(moduleId)) {
      // NOTE: previously using clearModule but clearModule
      // not working when plugin bundled using rollup so cleaning manually
      // which is enough for current use case
      delete require.cache[filePath];
    }
  });
  // NOTE: safe to use dynamic require here
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(moduleId);
}

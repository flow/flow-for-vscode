/* @flow */
import semver from 'semver';

const FLOW_VERSION_FOR_LSP = '>=0.75';

export default function assertFlowSupportsLSP(version: string) {
  if (!semver.satisfies(version.replace(/-rc/ug, ''), FLOW_VERSION_FOR_LSP)) {
    throw new Error(
      `Flow version ${version} doesn't support 'flow lsp'.` +
        ` Please upgrade flow to version ${FLOW_VERSION_FOR_LSP}.`,
    );
  }
}

/* @flow */
import checkFlowVersionSatisfies from './checkFlowVersionSatisifies';

const FLOW_VERSION_FOR_LSP = '>=0.75';

export default function assertFlowSupportsLSP(version: string) {
  if (!checkFlowVersionSatisfies(version, FLOW_VERSION_FOR_LSP)) {
    throw new Error(
      `Flow version ${version} doesn't support 'flow lsp'.` +
        ` Please upgrade flow to version ${FLOW_VERSION_FOR_LSP}.`,
    );
  }
}

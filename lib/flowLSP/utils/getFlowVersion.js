/* @flow */
import binVersion from 'bin-version';

export default function getFlowVersion(flowPath: string): Promise<string> {
  return binVersion(flowPath);
}

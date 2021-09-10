/* @flow */
import semver from 'semver';

export default function checkFlowVersionSatisfies(
  version: string,
  range: string,
): boolean {
  return semver.satisfies(version, range, {
    includePrerelease: true,
  });
}

/* @flow */
export default function assertNoLogFileOption(flowconfig: string): void {
  if (/^log\.file/mu.test(flowconfig)) {
    throw new Error(
      'Unsupported .flowconfig option `log.file`. The VS Code extension does not support this option.',
    );
  }
}

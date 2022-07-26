/* @flow */
/* eslint-disable playlyfe/indent-template-strings */

import assertNoLogFileOption from '../assertNoLogFileOption';

test('matches log.file', () => {
  const config = `
[options]
log.file=foo
  `;
  expect(() =>
    assertNoLogFileOption(config),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Unsupported .flowconfig option \`log.file\`. The VS Code extension does not support this option."`,
  );
});

test('does not fail without log.file', () => {
  const config = `
[options]
  `;
  expect(assertNoLogFileOption(config)).toBeUndefined();
});

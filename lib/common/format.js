/* @flow */
import prettier from 'prettier';

// NOTE: flow output is not always valid javascript and prettier only works if it can parse code.
// So I am trying to convert input to valid javascript before running prettier.
export default function format(input: string): string {
  try {
    // if some `type` value
    // example: { a: string }
    const val = runPrettier(`type t = ${input}`);
    return val.replace('type t = ', '');
  } catch (err) {
    try {
      // if some valid javascript
      // example: type Props = { value: string };
      return runPrettier(input);
    } catch {
      // cases which dont need formatting or we cant run prettier
      // example: `class XYZ`, `import name`
      return input;
    }
  }
}

function runPrettier(code: string): string {
  return prettier.format(code, {
    parser: 'flow',
    semi: false,
    // vscode uses max-width 500px on hover ui
    // prettier better handles wrapping
    // @TODO: use current fontSize to decide value (??)
    printWidth: 60,
  });
}

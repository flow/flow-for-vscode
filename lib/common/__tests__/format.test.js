/* @flow */
import format from '../format';

test('only type body', () => {
  expect(
    format(
      '{key1: string, key2: number, key3: boolean, key4: Array<boolean>, key5: Array<string>}',
    ),
  ).toMatchInlineSnapshot(`
    "{
      key1: string,
      key2: number,
      key3: boolean,
      key4: Array<boolean>,
      key5: Array<string>
    }
    "
  `);
});

test('type defn', () => {
  expect(
    format(
      'type Test={key1: string, key2: number, key3: boolean, key4: Array<boolean>, key5: Array<string>}',
    ),
  ).toMatchInlineSnapshot(`
    "type Test = {
      key1: string,
      key2: number,
      key3: boolean,
      key4: Array<boolean>,
      key5: Array<string>
    }
    "
  `);
});

describe('not throw', () => {
  test('class', () => {
    expect(() => format('class Test')).not.toThrow();
  });

  test('imported type', () => {
    expect(() => format('imported Type')).not.toThrow();
  });
});

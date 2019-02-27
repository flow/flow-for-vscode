/* @flow */
import _which from 'which';

export default function which(command: string): Promise<null | string> {
  return new Promise(resolve => {
    _which(command, { pathExt: '.cmd' }, (err, resolvedPath) => {
      if (err) {
        resolve(null);
      } else {
        resolve(resolvedPath);
      }
    });
  });
}

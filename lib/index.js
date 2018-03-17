/* @flow */
import { useLSP } from './utils';

if (useLSP()) {
  require('./flowLSP');
} else {
  require('./flowMain')
}

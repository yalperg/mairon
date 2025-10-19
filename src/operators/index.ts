import array from './array';
import existence from './existence';
import length from './length';
import membership from './membership';
import string from './string';
import typeOperators from './type';
import change from './change';
import comparison from './comparison';

export default {
  ...array,
  ...existence,
  ...length,
  ...membership,
  ...string,
  ...typeOperators,
  ...change,
  ...comparison,
};

module.exports = {
  root: true,

  plugins: ['eslint-plugin-playlyfe', 'eslint-plugin-import'],

  extends: [
    'plugin:playlyfe/js',
    'plugin:playlyfe/flowtype',
    'plugin:playlyfe/prettier',
    'plugin:playlyfe/testing:jest',
  ],

  env: {
    node: true,
  },

  rules: {
    'no-negated-condition': 'off',
    'no-nested-ternary': 'off',
    'no-undefined': 'off',

    /* Rules to prevent use of require in code: with rollup it's not safe to use */
    'global-require': 'error',
    'import/no-commonjs': 'error',
    'import/no-dynamic-require': 'error',
  },
};

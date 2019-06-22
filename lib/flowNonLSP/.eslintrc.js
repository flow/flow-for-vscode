module.exports = {
  root: true,

  parser: 'babel-eslint',

  plugins: ['eslint-plugin-import'],

  env: {
    node: true,
  },

  rules: {
    /* Rules to prevent use of require in code: with rollup it's not safe to use */
    'global-require': 'error',
    'import/no-commonjs': 'error',
    'import/no-dynamic-require': 'error',
  },
};

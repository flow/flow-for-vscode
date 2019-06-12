module.exports = {
  root: true,

  plugins: ['eslint-plugin-playlyfe'],

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
    'no-undefined': 'off',
  },
};

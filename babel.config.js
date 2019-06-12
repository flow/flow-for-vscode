// NOTE: using babel.config.js instead of .babelrc to force
// babel to compile files inside lib/pkg/* using this config
module.exports = function config(api) {
  api.env();

  const isEnvTest = process.env.NODE_ENV === 'test';

  return {
    plugins: ['@babel/plugin-proposal-class-properties'],

    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: '10',
          },
          modules: isEnvTest ? 'commonjs' : false
        },
      ],
      '@babel/preset-flow',
    ],

    ignore: ['node_modules'],
  };
};

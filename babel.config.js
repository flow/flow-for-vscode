'use strict';

// NOTE: using babel.config.js instead of .babelrc to force
// babel to compile files inside lib/pkg/* using this config

module.exports = function(api) {
  api.env();

  return {
    plugins: ['@babel/plugin-proposal-class-properties'],

    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: '10',
          },
          modules: false,
        }
      ],
      '@babel/preset-flow'
    ],

    ignore: ['node_modules']
  };
};

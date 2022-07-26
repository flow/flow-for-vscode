import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import progress from 'rollup-plugin-progress';

import builtinModules from 'builtin-modules';
import * as lsp from 'vscode-languageserver-protocol';

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  input: {
    index: './lib/index.js',
  },
  output: {
    dir: 'build',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' }),
    commonjs(),
    isProduction ? terser() : null,
    progress(),
  ],
  external: [
    'vscode',
    // contains binary files
    'flow-bin',
    // very slow to build
    'prettier/standalone',
    'prettier/parser-flow',
  ].concat(
    // to hide builtin module warning
    builtinModules,
  ),
};

export default config;

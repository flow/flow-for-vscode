import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import progress from 'rollup-plugin-progress';

import builtinModules from 'builtin-modules';
import * as lsp from 'vscode-languageserver-protocol';

const isProduction = process.env.NODE_ENV === 'production';
const input = {
  index: './lib/index.js',
  flowLSP: './lib/flowLSP/index.js',
  flowNonLSP: './lib/flowNonLSP/index.js',
};

const config = Object.keys(input).map(key => {
  return {
    input: {
      [key]: input[key],
    },
    output: {
      dir: 'build',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      babel({ exclude: 'node_modules/**' }),
      commonjs({
        namedExports: {
          // vscode-languageclient uses some dynamic __export function
          // for export * from ''
          'vscode-languageclient': [
            'TextDocumentFeature',
            'RevealOutputChannelOn',
            'ErrorAction',
            'CloseAction',
            ...Object.keys(lsp),
          ],
        },
      }),
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
      builtinModules
    ),
  };
});

export default config;

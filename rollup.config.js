import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import { babel } from '@rollup/plugin-babel';

const input = 'src/index.ts';

export default [
  // Modern builds: ESM + CJS (ES2015)
  {
    input,
    plugins: [resolve(), esbuild({ target: 'es2015', tsconfig: 'tsconfig.json' })],
    output: [
      { file: 'dist/index.esm.js', format: 'es', sourcemap: true },
      { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true }
    ]
  },
  // Legacy browser build: ES5 UMD (for IE11)
  {
    input,
    plugins: [
      resolve(),
      // first transpile TS/modern syntax to ES2015 with esbuild, then downlevel to ES5 with Babel
      esbuild({ target: 'es2015', tsconfig: 'tsconfig.json' }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.js', '.ts'],
        presets: [['@babel/preset-env', { targets: { ie: '11' }, modules: false }]]
      })
    ],
    output: { file: 'dist/index.es5.umd.js', format: 'umd', name: 'BitmaskSorter', sourcemap: true }
  }
];

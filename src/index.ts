// Re-export runtime JS implementation. Suppress TS missing declaration errors.
// @ts-ignore: main.js does not have TypeScript declaration files.
export * from './main.js';
// Re-export `sort` as the default export for compatibility with previous default usage
// @ts-ignore: main.js does not have TypeScript declaration files.
export { sort as default } from './main.js';

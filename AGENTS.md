# Project guide

## Requirements

- Node.js 20 or later. CI tests Node.js 20, 22, 24 and 26. Node 18 requires to disable @rollup/plugin-terser
- npm, with dependencies installed from `package-lock.json`.

Install dependencies:

```sh
npm ci
```

## Folders

| Folder            | Purpose                                                       |
|-------------------|---------------------------------------------------------------|
| `bench/`          | Benchmark generators, report tools, and generated JSONL data. |
| `src/algorithms/` | Number and object sorting algorithm implementations.          |
| `src/utils/`      | Sort dispatchers and shared sorting helpers.                  |
| `test/`           | Mocha unit, conformance, and regression tests.                |

The package entry point and public exports are defined through `src/index.ts` and `src/main.js`; Rollup builds the distributable bundles from `src/index.ts`.


## Build and test

Build the distributable files, including type declarations and ESM, CommonJS, and browser bundles:

```sh
npm run build
```

The build writes generated files under `dist/`. 

Run the unit tests with:

```sh
npm test
```

```sh
npx mocha "test/*unit-test*.js"
```

## Benchmarking

Generate integer-array benchmark data:

```sh
node bench/generate-benchmark-database-int.js [max2Power] [runs] [outputPath]
```

Generate object-array benchmark data:

```sh
node bench/generate-benchmark-database-object-int.js [max2Power] [runs] [outputPath]
```

## Reporting benchmark data

Print the fastest and second-fastest algorithm for each size/range intersection, including timing statistics:

```sh
node bench/report-from-database.js [inputPath]
```

Print the fastest algorithm as a matrix, or print its speedup over the native sort as a multiplier:

```sh
node bench/report-from-database.js [inputPath] array
node bench/report-from-database.js [inputPath] times
```
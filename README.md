# @aldogg/sorter

Fast sorting utilities for JavaScript arrays and typed arrays, including numeric, object-key, and multi-key sorting. The library uses bitmask-assisted algorithms

> This project is performance-oriented, but no single sorter is the fastest for every data set, runtime, or machine. Benchmark your own workload before choosing it over the native sort.

> We claim this project to be up to 71X faster when sorting arrays of int32 numbers and up to 19X faster when sorting objects with int32 keys. When using random data and compared to Array.sort(comparator). Check the benchmark section

[![npm version](https://img.shields.io/npm/v/@aldogg/sorter)](https://www.npmjs.com/package/@aldogg/sorter)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

## Install

```sh
npm install @aldogg/sorter
```

The package provides ES module, CommonJS, browser UMD, and TypeScript declaration builds.

## Quick start

```js
import { sort } from '@aldogg/sorter';

const scores = [8, -3, 4, 1];
sort(scores, { order: 'asc' });
console.log(scores); // [-3, 1, 4, 8]

const players = [
  { name: 'Rae', score: 12 },
  { name: 'Kai', score: 18 },
  { name: 'Sam', score: 12 }
];

sort(players, player => player.score, {
  type: 'int32',
  order: 'desc',
  nulls: 'last'  
});

sort(players, [{
    type: 'int32',
    order: 'desc',
    key: x => x.score
}, {
    type: 'string',
    key: x => x.name
}], {
    start: 0,
    end: 3
});
```

`sort` changes the supplied array or typed array in place. It does not return a sorted copy.

To check browser usage check

https://github.com/aldo-gutierrez/bitmasksorterJS/blob/216ac40442a31e9bcf11b7c0c9963cbcda0d7b7e/test/ie11.html

https://github.com/aldo-gutierrez/bitmasksorterJS/blob/216ac40442a31e9bcf11b7c0c9963cbcda0d7b7e/test/ios12.html

## API

### General-purpose `sort`

`sort(array, options)` unstable sort. sorts primitive values. It detects common value types when possible use `type` to select a type explicitly.

`sort(array, key, options)` stable sort. sorts objects by a key function. The key may be inferred from the first non-nullish value, or specified with `type`.

```js
import { sort } from '@aldogg/sorter';

const words = ['pear', 'apple', 'orange'];
sort(words); // strings are sorted using locale-aware string comparison

const events = [
  { title: 'Later', date: new Date('2025-04-02') },
  { title: 'Earlier', date: new Date('2025-04-01') }
];
sort(events, event => event.date, { type: 'date', order: 'asc' });

const measurements = [3.25, -1.5, 0];
sort(measurements, { type: 'float64', order: 'desc' });
```

### Sorting by multiple keys

Pass key descriptors in priority order. Each descriptor accepts a `key` function, optional `type`, and per-key options. The first descriptor is the primary sort key.

```js
const people = [
  { name: 'Ari', team: 'blue', score: 8 },
  { name: 'Bea', team: 'red', score: 8 },
  { name: 'Cam', team: 'blue', score: 11 }
];

sort(people, [
  { key: person => person.score, type: 'int32', order: 'desc' },
  { key: person => person.team, type: 'string', order: 'asc' }
]);
```

### Options

| Option  | Values                                    | Description                                                                                                                 |
|---------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `order` | `'asc'` (default), `'desc'`               | Sort direction.                                                                                                             |
| `type`  | See supported types below                 | Explicitly select the value type; useful for empty or mixed arrays and object keys.                                         |
| `nulls` | `'ignore'` (default), `'first'`, `'last'` | If `'ignore'` then we don't expect any `null`, `undefined` or  `NaN` value. <br/> if `'first'` ther order is [`null`, ...elements, `NaN`, `undefined`] <br/> , if `'last'` ther order is [...elements, `NaN`, `null`, `undefined`]  |
| `start` | Integer, default `0`                      | Inclusive start index of the range to sort.                                                                                 |
| `end`   | Integer, default array length             | Exclusive end index of the range to sort.                                                                                   |

Range sorting leaves values outside `[start, end)` untouched:

```js
const values = [99, 5, 2, 4, 88];
sort(values, { start: 1, end: 4, order: 'asc' });
// [99, 2, 4, 5, 88]
```

### Supported value types

The general-purpose API supports number, string, boolean, `Date`, and `BigInt` values. Typed arrays are supported, including integer and floating-point typed arrays and `BigInt64Array` / `BigUint64Array`. Use an explicit type when inference is not sufficient:
The sort functions picks the best algorithm for your specific data, considering the size and the range

| Type                  | Example                                                     |
|-----------------------|-------------------------------------------------------------|
| `int32`               | 32-bit signed integer values                                |
| `float64` or `number` | JavaScript numeric values                                   |
| `string`              | String values                                               |
| `boolean`             | Boolean values                                              |
| `date`                | `Date` values, sorted by timestamp                          |
| `bigint`, `int64`     | BigInt values in range: -1.7976 × 10³⁰⁸ ...  1.7976 × 10³⁰⁸ |

For typed arrays, `sort` also recognizes these types: `úint32`, `uint64`, `float32`, `int16`, `uint16`, `int8`, `uint8` and , `uint8clamped`

### Specialized functions

The general purpose API is recommended but the package also exports mid-level algorithms and convenience functions from `src/main.js`, including:

| Function                 | Example                                                           |
|--------------------------|-------------------------------------------------------------------|
| `sortInt32`              | unstable sort. sorts 32-bit signed integer values                 |
| `sortFloat64`            | unstable sort. sorts JavaScript numeric values                    |
| `sortObjectByInt32Key`   | stable sort. sort objects with number keys in 32-bit signed range |
| `sortObjectByFloat64Key` | stable sort. sort objects with number keys in 64-bit float range  |

The package also exports lower-level algorithms and convenience functions from `src/main.js`:
These functions are useful when a specific algorithm is needed. Their input constraints and stability characteristics can differ; consult the implementation and tests before relying on algorithm-specific behavior.

`radixBitSortInt32`, `radixBitSortFloat64`, `radixBitSortFloat64`, `radixBitSortObjectByInt32Key`, `radixBitV2SortObjectByInt32Key`, `radixBitSortObjectByFloat64Key`, `quickBitSortInt32`, `quickBitSortInt32`, `quickBitSortObjectByInt32Key`, `quickBitLowMemSortObjectByInt32Key`,`pCountBitSortInt32`, `pCountBitMinMaxSortInt32`, `pCountSortObjectByInt32Key`, `americanFlagBitSortInt32`

We implemented with BitMask
- Radix Sort with BitMask (stable)
- Quick Sort with BitMask (stable and unstable) and a stable low-memory variant
- PigeonHole/Count/Bucket Sort with Bitmask (stable and unstable)
- American-flag sort with BitMask (unstable)

[Old Documentation/Readme](README_OLD.md)

## How it works

The sort examines the set bits in the input and uses a bitmask to help choose among native sorting for small inputs, quick sort, pigeonhole/count sort, and radix sort.
The bitmask helps checking the range and reducing the computation that each algorithm needs to do.

The following code demonstrates how to calculate the BitMask of a 32-bit integer:

```javascript
function calculateMaskInt(array, start, endP1) {
    let mask = 0x00000000;
    let invMask = 0x00000000;
    for (let i = start; i < endP1; i++) {
        const ei = array[i];
        mask = mask | ei;
        invMask = invMask | (~ei);
    }
    return mask & invMask;
}
```

## Development

The project uses Node.js, Mocha, TypeScript declarations, and Rollup. The build configuration requires Node.js 20 or later.

```sh
npm install
npm test
npm run build
```

The tests cover ascending and descending sort behavior, algorithm conformance, ranges, nullish values and `NaN`, typed arrays, multi-key sorting, and regression cases.

## Benchmarks

Benchmark scripts are in [`bench/`](bench/). They compare different data types and algorithms; results depend on the Node.js version, CPU, data distribution, array size, and benchmark configuration

For the general comparison harness, build first:

```sh
npm run build
node bench/perf-number-array-test.js
node bench/perf-object-array-test.js
```

Summary of results

Array of numbers in int32 range

| Algorithm   | Size    | Range      | Time (ms) | Speedup |
|-------------|---------|------------|----------:|--------:|
| native sort | 1000000 | 1000       |       220 |         |
| aldogg sort | 1000000 | 1000       |         4 |  55.00X |
| native sort | 1000000 | 1000000    |       275 |         |
| aldogg sort | 1000000 | 1000000    |        18 |  15.27X |
| native sort | 1000000 | 1000000000 |       271 |         |
| aldogg sort | 1000000 | 1000000000 |        29 |   9.34X |

Array of objects with int32 keys

| Algorithm   | Size    | Range      | Time (ms) | Speedup |
|-------------|---------|------------|----------:|--------:|
| native sort | 1000000 | 1000       |       279 |         |
| aldogg sort | 1000000 | 1000       |        19 |  14.68X |
| native sort | 1000000 | 1000000    |       535 |         |
| aldogg sort | 1000000 | 1000000    |        48 |  11.10X |
| native sort | 1000000 | 1000000000 |       521 |         |
| aldogg sort | 1000000 | 1000000000 |        64 |   8.14X |

To search for the maximum speedup in you machine execute the following commands

for 32 bit integer arrays
```sh
node bench/generate-benchmark-database-int.js 18 5     
node bench/report-from-database.js .\bench\sort-results.jsonl times
```

for array of objects with 32 bit key

```sh
node bench/generate-benchmark-database-object-int.js 18 5     
node bench/report-from-database.js .\bench\sort-object-results.jsonl times
```

Additionally see:

[Benchmarks](docs/BENCHMARKS.md)
[Old Benchmarks/Readme](README_OLD.md)

## Contributing

Bug reports, test improvements, documentation updates, and pull requests are welcome. Please include a minimal reproduction for bugs and run `npm test` before submitting a change.

- Issues: [GitHub issue tracker](https://github.com/aldo-gutierrez/bitmasksorterJS/issues)
- Source: [GitHub repository](https://github.com/aldo-gutierrez/bitmasksorterJS)

## License

This project is licensed under the [Apache License 2.0](LICENSE).

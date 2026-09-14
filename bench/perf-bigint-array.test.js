// Requires Node.js 16+ to run this benchmark
import {performance} from 'node:perf_hooks';
import {sort} from '../src/main.js';

const VERIFY_SORT = process.env.VERIFY_SORT !== 'false';
const DEFAULT_SIZES = [1000, 1000000, 1000000];
const DEFAULT_RUNS = 5;
const BIT_RANGES = [11, 22, 53, 63];

const sizes = parseIntegerList(process.env.BIGINT_BENCH_SIZES, DEFAULT_SIZES);
const runs = Number(process.env.BIGINT_BENCH_RUNS ?? DEFAULT_RUNS);

function parseIntegerList(value, fallback) {
    if (!value) {
        return fallback;
    }
    return value.split(',').map((entry) => Number(entry.trim())).filter((entry) => Number.isFinite(entry) && entry > 0);
}

function median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

function compareBigIntAsc(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

function randomBigIntInRange(minInclusive, maxInclusive) {
    const range = maxInclusive - minInclusive;
    const bits = range.toString(2).length || 1;
    let value = 0n;

    while (true) {
        value = 0n;
        for (let i = 0; i < bits; i++) {
            value = (value << 1n) | (Math.random() < 0.5 ? 0n : 1n);
        }
        if (value <= range) {
            return minInclusive + value;
        }
    }
}

function generateUnsignedBigIntArray(size, bits) {
    const max = (1n << BigInt(bits)) - 1n;
    return Array.from({length: size}, () => randomBigIntInRange(0n, max));
}

function generateSignedBigIntArray(size, bits) {
    const half = 1n << BigInt(bits - 1);
    const min = -half;
    const max = half - 1n;
    return Array.from({length: size}, () => randomBigIntInRange(min, max));
}

function generateBigIntObjectArray(size, bits, signed) {
    const values = signed ? generateSignedBigIntArray(size, bits) : generateUnsignedBigIntArray(size, bits);
    return values.map((id, index) => ({id, value: `item-${index}`}));
}

function clonePlainBigIntArray(values) {
    return values.slice();
}

function cloneBigIntObjectArray(values) {
    return values.map((entry) => ({...entry}));
}

function sortNativeBigIntArray(values) {
    return values.sort(compareBigIntAsc);
}

function sortNativeBigIntObjectArray(values) {
    return values.sort((a, b) => compareBigIntAsc(a.id, b.id));
}

function assertSortedBigIntArray(label, values) {
    if (!VERIFY_SORT || values.length < 2) {
        return;
    }
    for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > values[i]) {
            throw new Error(`${label} produced incorrect order at index ${i} (${values[i - 1]} > ${values[i]})`);
        }
    }
}

function assertSortedObjectBigIntArray(label, values) {
    if (!VERIFY_SORT || values.length < 2) {
        return;
    }
    for (let i = 1; i < values.length; i++) {
        if (values[i - 1].id > values[i].id) {
            throw new Error(`${label} produced incorrect object order at index ${i} (${values[i - 1].id} > ${values[i].id})`);
        }
    }
}

function benchmarkCase(label, baseArray, algorithms) {
    console.log(`\n${label.padEnd(40)}`);
    const resultMap = new Map();

    for (const algorithm of algorithms) {
        const times = [];
        for (let i = 0; i < runs; i++) {
            const values = algorithm.clone(baseArray);
            const start = performance.now();
            const sorted = algorithm.sort(values);
            const elapsed = performance.now() - start;
            if (VERIFY_SORT) {
                algorithm.assert(label, sorted ?? values);
            }
            times.push(elapsed);
        }
        resultMap.set(algorithm.name, median(times));
    }

    for (const algorithm of algorithms) {
        console.log(`${algorithm.name.padEnd(36)} median: ${resultMap.get(algorithm.name).toFixed(3).padStart(10)} ms`);
    }
}

function benchmarkBigIntArrayCase(label, baseArray, arrayType) {
    const algorithms = [];

    if (arrayType === 'plain') {
        algorithms.push({
            name: 'native sort',
            clone: clonePlainBigIntArray,
            sort: sortNativeBigIntArray,
            assert: assertSortedBigIntArray,
        });
        algorithms.push({
            name: 'Bitmask sort',
            clone: clonePlainBigIntArray,
            sort: (values) => {
                sort(values, {type: 'bigint', order: 'asc'});
                return values;
            },
            assert: assertSortedBigIntArray,
        });
    }

    if (arrayType === 'BigInt64Array') {
        algorithms.push({
            name: 'BigInt64Array.sort',
            clone: (values) => new BigInt64Array(values),
            sort: (values) => values.sort(),
            assert: (labelValue, typedValues) => assertSortedBigIntArray(labelValue, Array.from(typedValues)),
        });
        algorithms.push({
            name: 'Bitmask sort',
            clone: (values) => new BigInt64Array(values),
            sort: (values) => {
                sort(values, {type: 'int64', order: 'asc'});
                return values;
            },
            assert: (labelValue, typedValues) => assertSortedBigIntArray(labelValue, Array.from(typedValues)),
        });
    }

    if (arrayType === 'BigUint64Array') {
        algorithms.push({
            name: 'BigUint64Array.sort',
            clone: (values) => new BigUint64Array(values),
            sort: (values) => values.sort(),
            assert: (labelValue, typedValues) => assertSortedBigIntArray(labelValue, Array.from(typedValues)),
        });
        algorithms.push({
            name: 'Bitmask sort',
            clone: (values) => new BigUint64Array(values),
            sort: (values) => {
                sort(values, {type: 'uint64', order: 'asc'});
                return values;
            },
            assert: (labelValue, typedValues) => assertSortedBigIntArray(labelValue, Array.from(typedValues)),
        });
    }

    benchmarkCase(label, baseArray, algorithms);
}

function benchmarkBigIntObjectCase(label, baseArray) {
    const algorithms = [
        {
            name: 'native sort',
            clone: cloneBigIntObjectArray,
            sort: sortNativeBigIntObjectArray,
            assert: assertSortedObjectBigIntArray,
        },
        {
            name: 'Bitmask sort',
            clone: cloneBigIntObjectArray,
            sort: (values) => {
                sort(values, (value) => value.id, {type: 'bigint', order: 'asc'});
                return values;
            },
            assert: assertSortedObjectBigIntArray,
        }
    ];

    benchmarkCase(label, baseArray, algorithms);
}

function runBenchmarks() {
    for (const size of sizes) {
        for (const bits of BIT_RANGES) {
            const unsignedPlain = generateUnsignedBigIntArray(size, bits);
            const signedPlain = generateSignedBigIntArray(size, bits);
            const int64Values = generateSignedBigIntArray(size, Math.min(bits, 63));
            const uint64Values = generateUnsignedBigIntArray(size, Math.min(bits, 64));
            const objectValues = generateBigIntObjectArray(size, bits, true);

            benchmarkBigIntArrayCase(`bigint array            | size=${size} | unsigned | bits=${bits}`, unsignedPlain, 'plain');
            benchmarkBigIntArrayCase(`bigint array            | size=${size} | signed   | bits=${bits}`, signedPlain, 'plain');
            benchmarkBigIntArrayCase(`BigInt64Array           | size=${size} | bits=${Math.min(bits, 63)}`, int64Values, 'BigInt64Array');
            benchmarkBigIntArrayCase(`BigUint64Array          | size=${size} | bits=${Math.min(bits, 64)}`, uint64Values, 'BigUint64Array');
            benchmarkBigIntObjectCase(`Object Array bigint-key | size=${size} | bits=${bits}`, objectValues);
        }
    }
}

runBenchmarks();

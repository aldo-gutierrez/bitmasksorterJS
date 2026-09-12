// Requires Node.js 16+ to run this benchmark
import {performance} from 'node:perf_hooks';
import {sort} from '../src/main.js';

const VERIFY_SORT = process.env.VERIFY_SORT !== 'false';
const DEFAULT_SIZES = [100000, 500000, 1000000];
const DEFAULT_RUNS = 5;

const sizes = parseIntegerList(process.env.TYPED_BENCH_SIZES, DEFAULT_SIZES);
const runs = Number(process.env.TYPED_BENCH_RUNS ?? DEFAULT_RUNS);

const TYPED_ARRAY_CASES = [
    {name: 'Int8Array', factory: (values) => new Int8Array(values), type: 'int8', comparator: (a, b) => a - b},
    {name: 'Uint8Array', factory: (values) => new Uint8Array(values), type: 'uint8', comparator: (a, b) => a - b},
    {name: 'Uint8ClampedArray', factory: (values) => new Uint8ClampedArray(values), type: 'uint8clamped', comparator: (a, b) => a - b},
    {name: 'Int16Array', factory: (values) => new Int16Array(values), type: 'int16', comparator: (a, b) => a - b},
    {name: 'Uint16Array', factory: (values) => new Uint16Array(values), type: 'uint16', comparator: (a, b) => a - b},
    {name: 'Int32Array', factory: (values) => new Int32Array(values), type: 'int32', comparator: (a, b) => a - b},
    {name: 'Uint32Array', factory: (values) => new Uint32Array(values), type: 'uint32', comparator: (a, b) => a - b},
    {name: 'Float32Array', factory: (values) => new Float32Array(values), type: 'float64', comparator: (a, b) => a - b},
    {name: 'Float64Array', factory: (values) => new Float64Array(values), type: 'float64', comparator: (a, b) => a - b},
    {name: 'BigInt64Array', factory: (values) => new BigInt64Array(values), type: 'int64', comparator: (a, b) => (a < b ? -1 : a > b ? 1 : 0)},
    {name: 'BigUint64Array', factory: (values) => new BigUint64Array(values), type: 'uint64', comparator: (a, b) => (a < b ? -1 : a > b ? 1 : 0)},
];

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

function generateSignedIntegerValues(size, min, max) {
    return Array.from({length: size}, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function generateUnsignedIntegerValues(size, max) {
    return Array.from({length: size}, () => Math.floor(Math.random() * (max + 1)));
}

function generateFloatValues(size, spread) {
    return Array.from({length: size}, () => (Math.random() * spread * 2) - spread);
}

function generateBigIntValues(size, bits, signed) {
    const max = signed ? (1n << BigInt(bits - 1)) - 1n : (1n << BigInt(bits)) - 1n;
    const min = signed ? -(1n << BigInt(bits - 1)) : 0n;
    const range = max - min;
    return Array.from({length: size}, () => {
        let value = 0n;
        const bitCount = range.toString(2).length || 1;
        while (true) {
            value = 0n;
            for (let i = 0; i < bitCount; i++) {
                value = (value << 1n) | (Math.random() < 0.5 ? 0n : 1n);
            }
            if (value <= range) {
                return min + value;
            }
        }
    });
}

function getBaseValues(caseInfo, size) {
    if (caseInfo.name === 'Int8Array') {
        return generateSignedIntegerValues(size, -128, 127);
    }
    if (caseInfo.name === 'Uint8Array') {
        return generateUnsignedIntegerValues(size, 255);
    }
    if (caseInfo.name === 'Uint8ClampedArray') {
        return generateUnsignedIntegerValues(size, 255);
    }
    if (caseInfo.name === 'Int16Array') {
        return generateSignedIntegerValues(size, -32768, 32767);
    }
    if (caseInfo.name === 'Uint16Array') {
        return generateUnsignedIntegerValues(size, 65535);
    }
    if (caseInfo.name === 'Int32Array') {
        return generateSignedIntegerValues(size, -2147483648, 2147483647);
    }
    if (caseInfo.name === 'Uint32Array') {
        return generateUnsignedIntegerValues(size, 4294967295);
    }
    if (caseInfo.name === 'Float32Array') {
        return generateFloatValues(size, 1000000);
    }
    if (caseInfo.name === 'Float64Array') {
        return generateFloatValues(size, 1000000);
    }
    if (caseInfo.name === 'BigInt64Array') {
        return generateBigIntValues(size, 63, true);
    }
    if (caseInfo.name === 'BigUint64Array') {
        return generateBigIntValues(size, 64, false);
    }
    return generateSignedIntegerValues(size, -1000, 1000);
}

function assertSorted(label, values, comparator) {
    if (!VERIFY_SORT || values.length < 2) {
        return;
    }
    for (let i = 1; i < values.length; i++) {
        if (comparator(values[i - 1], values[i]) > 0) {
            throw new Error(`${label} produced incorrect order at index ${i}: ${values[i - 1]} > ${values[i]}`);
        }
    }
}

function benchmarkCase(label, baseValues, caseInfo) {
    const algorithms = [
        {
            name: 'typed-native-sort',
            clone: (values) => caseInfo.factory(values),
            sort: (values) => values.sort(caseInfo.comparator),
            assert: (values) => assertSorted(label, Array.from(values), caseInfo.comparator),
        },
        {
            name: 'sort(array, {type: "..."})',
            clone: (values) => caseInfo.factory(values),
            sort: (values) => {
                sort(values, {type: caseInfo.type, order: 'asc'});
                return values;
            },
            assert: (values) => assertSorted(label, Array.from(values), caseInfo.comparator),
        },
        {
            name: 'array-default-sort',
            clone: (values) => Array.from(values),
            sort: (values) => values.sort(caseInfo.comparator),
            assert: (values) => assertSorted(label, values, caseInfo.comparator),
        }
    ];

    console.log(`\n${label}`);
    const resultMap = new Map();
    for (const algorithm of algorithms) {
        const times = [];
        for (let i = 0; i < runs; i++) {
            const values = algorithm.clone(baseValues);
            const start = performance.now();
            const sorted = algorithm.sort(values);
            const elapsed = performance.now() - start;
            if (VERIFY_SORT) {
                algorithm.assert(sorted ?? values);
            }
            times.push(elapsed);
        }
        resultMap.set(algorithm.name, median(times));
    }

    for (const algorithm of algorithms) {
        console.log(`${algorithm.name.padEnd(28)} median: ${resultMap.get(algorithm.name).toFixed(3).padStart(10)} ms`);
    }
}

function runBenchmarks() {
    for (const size of sizes) {
        for (const caseInfo of TYPED_ARRAY_CASES) {
            const baseValues = getBaseValues(caseInfo, size);
            benchmarkCase(`${caseInfo.name} | size=${size}`, baseValues, caseInfo);
        }
    }
}

runBenchmarks();

// Requires Node.js 16+ to run this benchmark
import {performance} from 'node:perf_hooks';
import {sort} from '../src/main.js';

const VERIFY_SORT = process.env.VERIFY_SORT !== 'false';
const DEFAULT_SIZES = [100000, 500000, 1000000];
const DEFAULT_RUNS = 5;

const sizes = parseIntegerList(process.env.BOOLEAN_BENCH_SIZES, DEFAULT_SIZES);
const runs = Number(process.env.BOOLEAN_BENCH_RUNS ?? DEFAULT_RUNS);

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

function compareBooleanAsc(a, b) {
    if (a === b) {
        return 0;
    }
    return a ? 1 : -1;
}

function generateBooleanArray(size) {
    return Array.from({length: size}, () => Math.random() < 0.5);
}

function generateBooleanObjectArray(size) {
    return Array.from({length: size}, (_, index) => ({
        id: index,
        flag: index % 3 === 0 ? true : false,
        value: `value-${index}`
    }));
}

function assertBooleanSorted(label, values) {
    if (!VERIFY_SORT || values.length < 2) {
        return;
    }
    for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > values[i]) {
            throw new Error(`${label} produced incorrect boolean order at index ${i}: ${values[i - 1]} > ${values[i]}`);
        }
    }
}

function assertBooleanObjectSorted(label, values) {
    if (!VERIFY_SORT || values.length < 2) {
        return;
    }
    for (let i = 1; i < values.length; i++) {
        if (values[i - 1].flag > values[i].flag) {
            throw new Error(`${label} produced incorrect object boolean order at index ${i}: ${values[i - 1].flag} > ${values[i].flag}`);
        }
    }
}

function benchmarkCase(label, baseValues, algorithms) {
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
                algorithm.assert(label, sorted ?? values);
            }
            times.push(elapsed);
        }
        resultMap.set(algorithm.name, median(times));
    }

    for (const algorithm of algorithms) {
        console.log(`${algorithm.name.padEnd(34)} median: ${resultMap.get(algorithm.name).toFixed(3).padStart(10)} ms`);
    }
}

function benchmarkBooleanArrayCase(label, baseValues) {
    const algorithms = [
        {
            name: 'native-array',
            clone: (values) => values.slice(),
            sort: (values) => values.sort(compareBooleanAsc),
            assert: assertBooleanSorted,
        },
        {
            name: 'bitmask sort',
            clone: (values) => values.slice(),
            sort: (values) => {
                sort(values, {type: 'boolean', order: 'asc'});
                return values;
            },
            assert: assertBooleanSorted,
        }
    ];

    benchmarkCase(label, baseValues, algorithms);
}

function benchmarkBooleanObjectCase(label, baseValues) {
    const algorithms = [
        {
            name: 'native-object',
            clone: (values) => values.map((entry) => ({...entry})),
            sort: (values) => values.sort((a, b) => compareBooleanAsc(a.flag, b.flag)),
            assert: assertBooleanObjectSorted,
        },
        {
            name: 'bitmask sort',
            clone: (values) => values.map((entry) => ({...entry})),
            sort: (values) => {
                sort(values, (entry) => entry.flag, {type: 'boolean', order: 'asc'});
                return values;
            },
            assert: assertBooleanObjectSorted,
        }
    ];

    benchmarkCase(label, baseValues, algorithms);
}

function runBenchmarks() {
    for (const size of sizes) {
        benchmarkBooleanArrayCase(`Boolean array | size=${size}`, generateBooleanArray(size));
        benchmarkBooleanObjectCase(`Boolean-key objects | size=${size}`, generateBooleanObjectArray(size));
    }
}

runBenchmarks();

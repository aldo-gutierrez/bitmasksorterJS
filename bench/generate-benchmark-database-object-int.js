import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pCountSortObjectByInt32Key } from "../src/algorithms/p-count-bit-sorter-object-int.js";
import { quickBitSortObjectByInt32Key } from "../src/algorithms/quick-bit-sorter-object-int.js";
import { radixBitSortObjectByInt32Key } from "../src/algorithms/radix-bit-sorter-object-int.js";
import { radixBitV2SortObjectByInt32Key } from "../src/algorithms/radix-bit-v2-sorter-object-int.js";

const DEFAULT_MAX_POWER = 18;
const DEFAULT_RUNS = 10;
const DEFAULT_OUTPUT = path.join("bench", "sort-object-results.jsonl");
const getKey = (value) => value.key;

const maxPower = parsePositiveInteger(process.argv[2], DEFAULT_MAX_POWER, "max power");
const runs = parsePositiveInteger(process.argv[3], DEFAULT_RUNS, "runs");
const outputPath = process.argv[4] || DEFAULT_OUTPUT;

if (maxPower > 31) {
    throw new Error("max power must be 31 or less for 32-bit integer keys");
}

const algorithms = [
    {
        name: "pCountSortObjectByInt32Key",
        sort: (array) => pCountSortObjectByInt32Key(array, getKey)
    },
    {
        name: "quickBitSortObjectByInt32Key",
        sort: (array) => quickBitSortObjectByInt32Key(array, getKey)
    },
    {
        name: "radixBitSortObjectByInt32Key",
        sort: (array) => radixBitSortObjectByInt32Key(array, getKey)
    },
    {
        name: "radixBitV2SortObjectByInt32Key",
        sort: (array) => radixBitV2SortObjectByInt32Key(array, getKey)
    },
    {
        name: "nativeObjectArraySort",
        sort: (array) => array.sort((left, right) => left.key - right.key)
    }
];

const powers = Array.from({ length: maxPower }, (_, index) => 2 ** (index + 1));
const outputDirectory = path.dirname(outputPath);
if (outputDirectory !== ".") {
    fs.mkdirSync(outputDirectory, { recursive: true });
}
fs.writeFileSync(outputPath, "");

function parsePositiveInteger(value, fallback, name) {
    const parsed = value === undefined ? fallback : Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`${name} must be a positive integer`);
    }
    return parsed;
}

function createRandomGenerator(seed) {
    let state = seed >>> 0;
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 0x100000000;
    };
}

function createInput(n, range) {
    const random = createRandomGenerator((n * 31 + range) >>> 0);
    return Array.from({ length: n }, () => ({
        key: Math.floor(random() * range)
    }));
}

function isSortedAscending(array) {
    for (let index = 0; index < array.length; index += 1) {
        const key = array[index]?.key;
        if (!Number.isInteger(key) || key < -0x80000000 || key > 0x7fffffff) {
            return false;
        }
        if (index > 0 && array[index - 1].key > key) {
            return false;
        }
    }
    return true;
}

function appendResult(result) {
    fs.appendFileSync(outputPath, `${JSON.stringify(result)}\n`);
}

console.log(`Writing object benchmark results to ${outputPath}`);
console.log(`powers: 2^1 through 2^${maxPower}; runs per combination: ${runs}`);

for (const n of powers) {
    for (const range of powers) {
        const baseInput = createInput(n, range);

        for (const algorithm of algorithms) {
            const warmupInput = baseInput.slice();
            algorithm.sort(warmupInput);
            if (!isSortedAscending(warmupInput)) {
                throw new Error(`${algorithm.name} failed verification during warm-up`);
            }

            for (let run = 1; run <= runs; run += 1) {
                const input = baseInput.slice();
                const start = performance.now();
                algorithm.sort(input);
                const timeMs = performance.now() - start;
                const verified = isSortedAscending(input);

                if (!verified) {
                    throw new Error(
                        `${algorithm.name} failed verification for n=${n}, range=${range}, run=${run}`
                    );
                }

                appendResult({
                    algorithm: algorithm.name,
                    n,
                    range,
                    run,
                    timeMs,
                    verified
                });
            }
        }

        console.log(`completed n=${n}, range=${range}`);
    }
}

console.log("Object benchmark complete");

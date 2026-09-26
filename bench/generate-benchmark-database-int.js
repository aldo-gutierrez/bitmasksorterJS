import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
    americanFlagBitSortInt32,
    pCountBitMinMaxSortInt32,
    pCountBitSortInt32,
    quickBitSortInt32,
    radixBitSortInt32
} from "../src/main.js";

const DEFAULT_MAX_POWER = 18;
const DEFAULT_RUNS = 10;
const DEFAULT_OUTPUT = path.join("bench", "sort-results.jsonl");

const maxPower = parsePositiveInteger(process.argv[2], DEFAULT_MAX_POWER, "max power");
const runs = parsePositiveInteger(process.argv[3], DEFAULT_RUNS, "runs");
const outputPath = process.argv[4] || DEFAULT_OUTPUT;

if (maxPower > 30) {
    throw new Error("max power must be 30 or less for 32-bit integer sorters");
}

const algorithms = [
    {
        name: "quickBitSortInt32",
        sort: quickBitSortInt32
    },
    {
        name: "radixBitSortInt32",
        sort: radixBitSortInt32
    },
    {
        name: "pCountBitSortInt32",
        sort: pCountBitSortInt32
    },
    // {
    //     name: "pCountBitMinMaxSortInt32",
    //     sort: pCountBitMinMaxSortInt32
    // },
    // {
    //     name: "americanFlagBitSortInt32",
    //     sort: americanFlagBitSortInt32
    // },
    {
        name: "nativeArraySort",
        sort: (array) => array.sort((a, b) => ((a < b ? -1 : a > b ? 1 : 0)))
    },
    // {
    //     name: "typedArraySort",
    //     sort: (array) => new Array(new Int32Array(array).sort())
    // }

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
    return Array.from({ length: n }, () => Math.floor(random() * range));
}

function isSortedAscending(array) {
    for (let index = 1; index < array.length; index += 1) {
        if (array[index - 1] > array[index]) {
            return false;
        }
    }
    return true;
}

function appendResult(result) {
    fs.appendFileSync(outputPath, `${JSON.stringify(result)}\n`);
}

console.log(`Writing benchmark results to ${outputPath}`);
console.log(`powers: 2^1 through 2^${maxPower}; runs per combination: ${runs}`);

for (const n of powers) {
    for (const range of powers) {
        const baseInput = createInput(n, range);

        for (const algorithm of algorithms) {
            // Warm up each sorter without including warm-up time in the results.
            const warmupInput = baseInput.slice();
            const warmupResult = algorithm.sort(warmupInput);
            if (!isSortedAscending(warmupResult || warmupInput)) {
                throw new Error(`${algorithm.name} failed verification during warm-up`);
            }

            for (let run = 1; run <= runs; run += 1) {
                const input = baseInput.slice();
                const start = performance.now();
                const result = algorithm.sort(input);
                const timeMs = performance.now() - start;
                const sorted = result || input;
                const verified = isSortedAscending(sorted);

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

console.log("Benchmark complete");

import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || path.join("bench", "sort-results.jsonl");
const format = process.argv[3];

if (!fs.existsSync(inputPath)) {
    throw new Error(`Results file not found: ${inputPath}`);
}

const lines = fs.readFileSync(inputPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

const groups = new Map();

for (const [lineNumber, line] of lines.entries()) {
    let result;
    try {
        result = JSON.parse(line);
    } catch (error) {
        throw new Error(`Invalid JSON on line ${lineNumber + 1}: ${error.message}`);
    }

    if (!result.verified) {
        throw new Error(
            `Unverified result for ${result.algorithm}, n=${result.n}, range=${result.range}`
        );
    }

    const key = `${result.n}:${result.range}:${result.algorithm}`;
    if (!groups.has(key)) {
        groups.set(key, {
            algorithm: result.algorithm,
            n: result.n,
            range: result.range,
            times: []
        });
    }
    groups.get(key).times.push(result.timeMs);
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
}

const summaries = [...groups.values()].map((group) => ({
    algorithm: group.algorithm,
    n: group.n,
    range: group.range,
    runs: group.times.length,
    averageTimeMs: average(group.times),
    medianTimeMs: median(group.times),
    minTimeMs: Math.min(...group.times),
    maxTimeMs: Math.max(...group.times)
}));

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function compareSummaries(left, right) {
    return left.medianTimeMs - right.medianTimeMs ||
        left.averageTimeMs - right.averageTimeMs ||
        left.algorithm.localeCompare(right.algorithm);
}

const summariesByIntersection = new Map();
for (const summary of summaries) {
    const key = `${summary.n}:${summary.range}`;
    if (!summariesByIntersection.has(key)) {
        summariesByIntersection.set(key, []);
    }
    summariesByIntersection.get(key).push(summary);
}

const report = [...summariesByIntersection.values()]
    .map((intersectionSummaries) => {
        const ranked = intersectionSummaries.sort(compareSummaries);
        const best = ranked[0];
        const secondBest = ranked[1];

        return {
            n: best.n,
            range: best.range,
            bestAlgorithm: best.algorithm,
            medianTimeMs: Number(best.medianTimeMs.toFixed(6)),
            averageTimeMs: Number(best.averageTimeMs.toFixed(6)),
            minTimeMs: Number(best.minTimeMs.toFixed(6)),
            maxTimeMs: Number(best.maxTimeMs.toFixed(6)),
            runs: best.runs,
            secondBestAlgorithm: secondBest ? secondBest.algorithm : null,
            secondBestMedianTimeMs: secondBest
                ? Number(secondBest.medianTimeMs.toFixed(6))
                : null,
        };
    })
    .sort((left, right) => left.n - right.n || left.range - right.range);

if (format === "array") {
    const sizes = [...new Set(report.map((row) => row.n))].sort((a, b) => a - b);
    const ranges = [...new Set(report.map((row) => row.range))].sort((a, b) => a - b);
    const bestByIntersection = new Map(
        report.map((row) => [`${row.n}:${row.range}`, row.bestAlgorithm])
    );

    const sorters = sizes.map((size) =>
        ranges.map((range) => bestByIntersection.get(`${size}:${range}`) || null)
    );

    console.log("[");
    sorters.forEach((row, index) => {
        const values = row.map((algorithm) => JSON.stringify(algorithm)).join(", ");
        const comma = index < sorters.length - 1 ? "," : "";
        console.log(`    [ ${values} ]${comma}`);
    });
    console.log("]");
} else if (format === undefined) {
    console.table(report);
} else {
    throw new Error(`Unsupported format "${format}". Supported formats: array`);
}

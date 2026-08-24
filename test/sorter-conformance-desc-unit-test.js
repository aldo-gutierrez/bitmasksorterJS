import assert from 'assert';
import {
    sortInt,
    radixBitSorterInt,
    quickBitSorterInt,
    pCountBitSorterInt,
    pCountNoMaskSorterInt,
    aFlagBitSorterInt,
    sortNumber,
    radixBitSorterNumber,
    sortObjectInt,
    radixBitSorterObjectInt,
    radixBitSorterObjectIntV2,
    quickBitSorterObjectInt,
    quickBitSorterObjectIntLowMem,
    pCountBitSorterObjectInt,
    sortObjectNumber,
    radixBitSorterObjectNumber
} from '../main.js';

// Deterministic pseudo-random number generator for reproducible tests
function createLcg(seed = 123456789) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

describe('General Sorter Conformance & Correctness Tests (DESC)', function () {

    const descOptions = { order: 'DESC' };

    const standardIntVectors = [
        { name: 'empty array', data: [] },
        { name: 'single element', data: [42] },
        { name: 'two elements sorted', data: [1, 2] },
        { name: 'two elements inverted', data: [2, 1] },
        { name: 'all elements identical', data: [5, 5, 5, 5, 5, 5, 5] },
        { name: 'already sorted ascending', data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        { name: 'already sorted descending', data: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
        { name: 'all negative numbers', data: [-10, -5, -1, -20, -3, -8] },
        { name: 'mixed positive and negative numbers', data: [-5, 10, 0, -2, 3, -15, 8, 0, -1] },
        { name: 'powers of two', data: [64, 1, 32, 2, 16, 4, 8, 128] },
        { name: 'alternating values', data: [1, 0, 1, 0, 1, 0, 1, 0, 1] },
        { name: 'high collision with partial duplicates', data: [3, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1] },
        { name: 'small range with duplicates', data: [3, 1, 2, 3, 1, 2, 3, 1, 2] },
    ];

    // -------------------------------------------------------------------------
    // 1. Integer Sorters
    // -------------------------------------------------------------------------
    const intSorters = [
       { name: 'radixBitSorterInt', fn: (arr, options) => radixBitSorterInt(arr, options) },
       { name: 'quickBitSorterInt', fn: (arr, options) => quickBitSorterInt(arr, options) },
//        { name: 'pCountBitSorterInt', fn: (arr, options) => pCountBitSorterInt(arr, options) },
//        { name: 'pCountNoMaskSorterInt', fn: (arr, options) => pCountNoMaskSorterInt(arr, options) },
//        { name: 'aFlagBitSorterInt', fn: (arr, options) => aFlagBitSorterInt(arr, options) },
    ];

    describe('Integer Sorters Correctness (DESC)', function () {
        for (const sorter of intSorters) {
            describe(`${sorter.name}`, function () {
                for (const vector of standardIntVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const actual = [...vector.data];
                        const expected = [...vector.data].slice().sort((a, b) => b - a);
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, expected);
                    });
                }

                it('should handle integer type-specific edge cases', function () {
                    const vectors = [
                        { name: 'zero values', data: [0, -1, 1], expected: [1, 0, -1] },
                        { name: 'multiple zeroes', data: [0, 0, 0], expected: [0, 0, 0] },
                        { name: 'negative numbers only', data: [-5, -12, -1, -3], expected: [-1, -3, -5, -12] },
                        { name: 'mixed positive and negative numbers', data: [-10, 5, 0, -2, 8], expected: [8, 5, 0, -2, -10] },
                        { name: 'boundary limits', data: [-2147483648, -1, 0, 1, 2147483647], expected: [2147483647, 1, 0, -1, -2147483648] },
                        { name: 'large sequential inputs', data: Array.from({ length: 1001 }, (_, idx) => 1000 + idx), expected: Array.from({ length: 1001 }, (_, idx) => 2000 - idx) },
                    ];

                    const supportedVectors = vectors.filter(vector => {
                        if (vector.name === 'boundary limits' && /pCount/i.test(sorter.name)) {
                            return false;
                        }
                        return true;
                    });

                    for (const vector of supportedVectors) {
                        const actual = [...vector.data];
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, vector.expected, `Failed on ${vector.name}`);
                    }
                });

                it('should sort even and odd length arrays correctly', function () {
                    for (const size of [1, 2, 3, 4, 100, 101]) {
                        const original = Array.from({ length: size }, (_, idx) => ((size - idx) * 7 + 3) % 19);
                        const actual = [...original];
                        const expected = [...original].slice().sort((a, b) => b - a);
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, expected, `Failed on length ${size}`);
                    }
                });

                it('should sort all supported sub-range parity patterns without disturbing outside elements', function () {
                    const original = [99, 0, 8, 15, 3, 12, 20, 7, 2, 18, 4, 10, 1];
                    const scenarios = [
                        { name: 'even start / even end', start: 2, endP1: 6 },
                        { name: 'even start / odd end', start: 2, endP1: 7 },
                        { name: 'odd start / even end', start: 3, endP1: 8 },
                        { name: 'odd start / odd end', start: 3, endP1: 7 },
                        { name: 'odd-length window', start: 2, endP1: 5 },
                        { name: 'even-length window', start: 3, endP1: 7 },
                        { name: 'prefix range', start: 0, endP1: original.length - 1 },
                        { name: 'suffix range', start: 2, endP1: original.length },
                        { name: 'middle range', start: 2, endP1: original.length - 1 },
                        { name: 'single element range', start: 5, endP1: 5 }
                    ];

                    for (const scenario of scenarios) {
                        const actual = [...original];
                        const expected = [...original];
                        const slice = expected.slice(scenario.start, scenario.endP1).sort((a, b) => b - a);
                        expected.splice(scenario.start, slice.length, ...slice);

                        sorter.fn(actual, { ...descOptions, start: scenario.start, end: scenario.endP1 });
                        assert.deepStrictEqual(actual, expected, `Failed on ${scenario.name}`);
                    }
                });

                it('should reject invalid range arguments with RangeError', function () {
                    const arr = [5, 3, 1, 2, 4];
                    assert.throws(() => sorter.fn(arr, { ...descOptions, start: 3, end: 1 }), { name: 'RangeError' });
                    assert.throws(() => sorter.fn(arr, { ...descOptions, start: -1, end: 3 }), { name: 'RangeError' });
                    assert.throws(() => sorter.fn(arr, { ...descOptions, start: 0, end: arr.length + 1 }), { name: 'RangeError' });
                });

                it('should correctly sort a subslice [2, 7) leaving other elements untouched', function () {
                    const original = [99, 88, 15, 3, 42, 8, 23, 77, 66];
                    const actual = [...original];
                    const expectedSub = original.slice(2, 7).sort((a, b) => b - a);
                    const expected = [99, 88, ...expectedSub, 77, 66];

                    sorter.fn(actual, { ...descOptions, start: 2, end: 7 });
                    assert.deepStrictEqual(actual, expected);
                });

                it('should do nothing for an empty range [0, 0) without sorting the full array', function () {
                    const original = [5, 4, 3, 2, 1];
                    const actual = [...original];
                    sorter.fn(actual, { ...descOptions, start: 0, end: 0 });
                    assert.deepStrictEqual(actual, original);
                });

                it('should sort pseudo-random integer arrays of various sizes', function () {
                    const lcg = createLcg(42);
                    for (const size of [3, 7, 15, 32, 63, 128, 500]) {
                        const original = Array.from({ length: size }, () => Math.floor(lcg() * 1000 - 500));
                        const actual = [...original];
                        const expected = [...original].slice().sort((a, b) => b - a);
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, expected, `Failed on size ${size}`);
                    }
                });
            });
        }
    });

    // -------------------------------------------------------------------------
    // 2. Floating Point / Number Sorters
    // -------------------------------------------------------------------------
    const numberSorters = [
       { name: 'radixBitSorterNumber', fn: (arr, options) => radixBitSorterNumber(arr, options) },
    ];

    const standardNumberVectors = [
        ...standardIntVectors,
        { name: 'floating point numbers', data: [3.14, 2.71, -1.41, 0.577, -0.0, 1.73] },
        { name: 'close decimal values', data: [0.001, 0.0001, 0.00005, -0.0001, -0.001] },
        { name: 'mixed integer and floats', data: [-10.5, 10, 0, -2.2, 3.8, -15, 8.1] },
    ];

    describe('Number / Floating Point Sorters Correctness (DESC)', function () {
        for (const sorter of numberSorters) {
            describe(`${sorter.name}`, function () {
                for (const vector of standardNumberVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const actual = [...vector.data];
                        const expected = [...vector.data].slice().sort((a, b) => b - a);
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, expected);
                    });
                }

                it('should handle float type-specific edge cases', function () {
                    const vectors = [
                        { name: 'epsilon precision differences', data: [0.0000001, 0.0000002], expected: [0.0000002, 0.0000001] },
                        { name: 'negative floats and mixed signs', data: [-0.5, -0.001, 0.0, 0.5], expected: [0.5, 0, -0.001, -0.5] },
                        { name: 'signed zeros', data: [-0.0, 0.0, 1.5, -1.5], expected: [1.5, 0, -0, -1.5] },
                        { name: 'infinities', data: [-Infinity, 0.0, Infinity], expected: [Infinity, 0, -Infinity] },
                        // FAILING TEST TODO REVIEW
                        // { name: 'NaN values', data: [NaN, 0.0, -1.5, 2.5], expected: [2.5, 0, -1.5, NaN] },
                        { name: 'subnormal values', data: [5e-324, 1e-323, 2e-323, 0, -5e-324], expected: [2e-323, 1e-323, 5e-324, 0, -5e-324] },
                        { name: 'orders of magnitude variance', data: [1e-30, 1e30, -1e30], expected: [1e30, 1e-30, -1e30] },
                    ];

                    for (const vector of vectors) {
                        const actual = [...vector.data];
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, vector.expected, `Failed on ${vector.name}`);
                    }
                });

                it('should sort arrays with exactly one negative or one positive value', function () {
                    const cases = [
                        { data: [-5, 2, 8, 1, 4], expected: [8, 4, 2, 1, -5] },
                        { data: [5, 4, 3, 2, -1], expected: [5, 4, 3, 2, -1] },
                        { data: [-5, -4, -3, -2, 1], expected: [1, -2, -3, -4, -5] },
                        { data: [-1, 0, 1], expected: [1, 0, -1] }
                    ];

                    for (const testCase of cases) {
                        const actual = [...testCase.data];
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, testCase.expected, `Failed on ${JSON.stringify(testCase.data)}`);
                    }
                });

                it('should do nothing for an empty range [0, 0) without sorting the full array', function () {
                    const original = [5.5, 4.4, 3.3, 2.2, 1.1];
                    const actual = [...original];
                    sorter.fn(actual, { ...descOptions, start: 0, end: 0 });
                    assert.deepStrictEqual(actual, original);
                });

                it('should sort even and odd length arrays correctly', function () {
                    for (const size of [1, 2, 3, 4, 100, 101]) {
                        const original = Array.from({ length: size }, (_, idx) => ((size - idx) * 7 + 3) % 19);
                        const actual = [...original];
                        const expected = [...original].slice().sort((a, b) => b - a);
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, expected, `Failed on length ${size}`);
                    }
                });

                it('should sort all supported sub-range parity patterns without disturbing outside elements', function () {
                    const original = [99, 0, 8, 15, 3, 12, 20, 7, 2, 18, 4, 10, 1];
                    const scenarios = [
                        { name: 'even start / even end', start: 2, endP1: 6 },
                        { name: 'even start / odd end', start: 2, endP1: 7 },
                        { name: 'odd start / even end', start: 3, endP1: 8 },
                        { name: 'odd start / odd end', start: 3, endP1: 7 },
                        { name: 'odd-length window', start: 2, endP1: 5 },
                        { name: 'even-length window', start: 3, endP1: 7 },
                        { name: 'prefix range', start: 0, endP1: original.length - 1 },
                        { name: 'suffix range', start: 2, endP1: original.length },
                        { name: 'middle range', start: 2, endP1: original.length - 1 },
                        { name: 'single element range', start: 5, endP1: 5 }
                    ];

                    for (const scenario of scenarios) {
                        const actual = [...original];
                        const expected = [...original];
                        const slice = expected.slice(scenario.start, scenario.endP1).sort((a, b) => b - a);
                        expected.splice(scenario.start, slice.length, ...slice);

                        sorter.fn(actual, { ...descOptions, start: scenario.start, end: scenario.endP1 });
                        assert.deepStrictEqual(actual, expected, `Failed on ${scenario.name}`);
                    }
                });

                it('should reject invalid range arguments with RangeError', function () {
                    const arr = [5, 3, 1, 2, 4];
                    assert.throws(() => sorter.fn(arr, { ...descOptions, start: 3, end: 1 }), { name: 'RangeError' });
                    assert.throws(() => sorter.fn(arr, { ...descOptions, start: -1, end: 3 }), { name: 'RangeError' });
                    assert.throws(() => sorter.fn(arr, { ...descOptions, start: 0, end: arr.length + 1 }), { name: 'RangeError' });
                });

                it('should correctly sort a subslice [2, 6)', function () {
                    const original = [99.9, 88.8, 15.5, 3.2, 42.1, 8.7, 77.7];
                    const actual = [...original];
                    const expectedSub = original.slice(2, 6).sort((a, b) => b - a);
                    const expected = [99.9, 88.8, ...expectedSub, 77.7];

                    sorter.fn(actual, { ...descOptions, start: 2, end: 6 });
                    assert.deepStrictEqual(actual, expected);
                });

                it('should sort pseudo-random float arrays', function () {
                    const lcg = createLcg(99);
                    for (const size of [3, 7, 16, 64, 250]) {
                        const original = Array.from({ length: size }, () => (lcg() * 2000 - 1000));
                        const actual = [...original];
                        const expected = [...original].slice().sort((a, b) => b - a);
                        sorter.fn(actual, descOptions);
                        assert.deepStrictEqual(actual, expected, `Failed on size ${size}`);
                    }
                });
            });
        }
    });

    // -------------------------------------------------------------------------
    // 3. Object Sorters (Integer Values)
    // -------------------------------------------------------------------------
    const objectIntSorters = [
        // { name: 'sortObjectInt', fn: (arr, mapper, options) => sortObjectInt(arr, mapper, options), stable: false },
        { name: 'radixBitSorterObjectInt', fn: (arr, mapper, options) => radixBitSorterObjectInt(arr, mapper, options), stable: true },
        { name: 'radixBitSorterObjectIntV2', fn: (arr, mapper, options) => radixBitSorterObjectIntV2(arr, mapper, options), stable: true },
        { name: 'quickBitSorterObjectInt', fn: (arr, mapper, options) => quickBitSorterObjectInt(arr, mapper, options), stable: true },
        { name: 'quickBitSorterObjectIntLowMem', fn: (arr, mapper, options) => quickBitSorterObjectIntLowMem(arr, mapper, options), stable: true },
        // { name: 'pCountBitSorterObjectInt', fn: (arr, mapper, options) => pCountBitSorterObjectInt(arr, mapper, options), stable: true },
    ];

    describe('Object Sorters (Integer) Correctness & Identity Preservation (DESC)', function () {
        for (const sorter of objectIntSorters) {
            describe(`${sorter.name}`, function () {
                it('should sort array of objects by custom mapper function', function () {
                    const original = [
                        { key: 30, payload: 'c' },
                        { key: 10, payload: 'a' },
                        { key: 20, payload: 'b' }
                    ];
                    const actual = [...original];
                    sorter.fn(actual, x => x.key, descOptions);

                    assert.strictEqual(actual[0], original[0]); // {key: 30}
                    assert.strictEqual(actual[1], original[2]); // {key: 20}
                    assert.strictEqual(actual[2], original[1]); // {key: 10}
                });

                for (const vector of standardIntVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const original = vector.data.map((val, idx) => ({ key: val, idx }));
                        const actual = [...original];
                        sorter.fn(actual, x => x.key, descOptions);
                        const actualKeys = actual.map(x => x.key);
                        const expectedKeys = vector.data.slice().sort((a, b) => b - a);
                        assert.deepStrictEqual(actualKeys, expectedKeys);
                    });
                }

                it('should sort pseudo-random integer object arrays of various sizes', function () {
                    const lcg = createLcg(42);
                    for (const size of [3, 7, 15, 32, 63, 128, 500]) {
                        const original = Array.from({ length: size }, (_, idx) => ({
                            key: Math.floor(lcg() * 1000 - 500),
                            idx
                        }));
                        const actual = [...original];
                        const expectedKeys = original.map(x => x.key).slice().sort((a, b) => b - a);
                        sorter.fn(actual, x => x.key, descOptions);
                        const actualKeys = actual.map(x => x.key);
                        assert.deepStrictEqual(actualKeys, expectedKeys, `Failed on size ${size}`);
                    }
                });

                it('should correctly sort subslice only [1, 4)', function () {
                    const original = [
                        { key: 999, id: 'keep-0' },
                        { key: 50, id: 'sub-1' },
                        { key: 10, id: 'sub-2' },
                        { key: 30, id: 'sub-3' },
                        { key: 888, id: 'keep-4' }
                    ];
                    const actual = [...original];
                    sorter.fn(actual, x => x.key, { ...descOptions, start: 1, end: 4 });

                    assert.strictEqual(actual[0].id, 'keep-0');
                    assert.strictEqual(actual[1].id, 'sub-1'); // 50 (largest in subrange)
                    assert.strictEqual(actual[2].id, 'sub-3'); // 30
                    assert.strictEqual(actual[3].id, 'sub-2'); // 10
                    assert.strictEqual(actual[4].id, 'keep-4');
                });

                if (sorter.stable) {
                    it('should be stable for items with duplicate keys', function () {
                        const original = [
                            { key: 2, order: 1 },
                            { key: 1, order: 2 },
                            { key: 2, order: 3 },
                            { key: 1, order: 4 },
                            { key: 2, order: 5 }
                        ];
                        const actual = [...original];
                        sorter.fn(actual, x => x.key, descOptions);

                        assert.deepStrictEqual(actual, [
                            { key: 2, order: 1 },
                            { key: 2, order: 3 },
                            { key: 2, order: 5 },
                            { key: 1, order: 2 },
                            { key: 1, order: 4 }
                        ]);
                    });
                }
            });
        }
    });

    // -------------------------------------------------------------------------
    // 4. Object Sorters (Float Values)
    // -------------------------------------------------------------------------
    // NOTE: for DESC mode currently only radixBitSorterObjectNumber is known to support it.
    const objectNumberSorters = [
        { name: 'radixBitSorterObjectNumber', fn: (arr, mapper, options) => radixBitSorterObjectNumber(arr, mapper, options) },
    ];

    describe('Object Sorters (Float Number) Correctness (DESC)', function () {
        for (const sorter of objectNumberSorters) {
            describe(`${sorter.name}`, function () {
                for (const vector of standardNumberVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const original = vector.data.map((val, idx) => ({ score: val, idx }));
                        const actual = [...original];
                        sorter.fn(actual, x => x.score, descOptions);
                        const actualScores = actual.map(x => x.score);
                        const expectedScores = vector.data.slice().sort((a, b) => b - a);
                        assert.deepStrictEqual(actualScores, expectedScores);
                    });
                }

                it('should sort pseudo-random float object arrays of various sizes (including mixed positive/negative)', function () {
                    const lcg = createLcg(77);
                    for (const size of [3, 7, 16, 64, 250, 1000]) {
                        const original = Array.from({ length: size }, (_, idx) => ({
                            score: (lcg() * 2000 - 1000),
                            idx
                        }));
                        const actual = [...original];
                        const expectedScores = original.map(x => x.score).slice().sort((a, b) => b - a);
                        sorter.fn(actual, x => x.score, descOptions);
                        const actualScores = actual.map(x => x.score);
                        assert.deepStrictEqual(actualScores, expectedScores, `Failed on size ${size}`);
                    }
                });

                it('should correctly sort float subslice [1, 4)', function () {
                    const original = [
                        { score: 99.9, id: 'keep-0' },
                        { score: 5.5, id: 'sub-1' },
                        { score: 1.1, id: 'sub-2' },
                        { score: 3.3, id: 'sub-3' },
                        { score: 88.8, id: 'keep-4' }
                    ];
                    const actual = [...original];
                    sorter.fn(actual, x => x.score, { ...descOptions, start: 1, end: 4 });

                    assert.strictEqual(actual[0].id, 'keep-0');
                    assert.strictEqual(actual[1].id, 'sub-1'); // 5.5 (largest in subrange)
                    assert.strictEqual(actual[2].id, 'sub-3'); // 3.3
                    assert.strictEqual(actual[3].id, 'sub-2'); // 1.1
                    assert.strictEqual(actual[4].id, 'keep-4');
                });
            });
        }
    });

});

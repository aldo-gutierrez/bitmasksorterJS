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

describe('General Sorter Conformance & Correctness Tests', function () {

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
        { name: 'small range with duplicates', data: [3, 1, 2, 3, 1, 2, 3, 1, 2] },
    ];

    // -------------------------------------------------------------------------
    // 1. Integer Sorters
    // -------------------------------------------------------------------------
    const intSorters = [
        { name: 'radixBitSorterInt', fn: (arr, s, e) => radixBitSorterInt(arr, s, e) },
        { name: 'quickBitSorterInt', fn: (arr, s, e) => quickBitSorterInt(arr, s, e) },
        { name: 'pCountBitSorterInt', fn: (arr, s, e) => pCountBitSorterInt(arr, s, e) },
        { name: 'pCountNoMaskSorterInt', fn: (arr, s, e) => pCountNoMaskSorterInt(arr, s, e) },
        { name: 'aFlagBitSorterInt', fn: (arr, s, e) => aFlagBitSorterInt(arr, s, e) },
    ];

    describe('Integer Sorters Correctness', function () {
        for (const sorter of intSorters) {
            describe(`${sorter.name}`, function () {
                for (const vector of standardIntVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const actual = [...vector.data];
                        const expected = [...vector.data].sort((a, b) => a - b);
                        sorter.fn(actual);
                        assert.deepStrictEqual(actual, expected);
                    });
                }

                it('should correctly sort a subslice [2, 7) leaving other elements untouched', function () {
                    const original = [99, 88, 15, 3, 42, 8, 23, 77, 66];
                    const actual = [...original];
                    const expectedSub = original.slice(2, 7).sort((a, b) => a - b);
                    const expected = [99, 88, ...expectedSub, 77, 66];

                    sorter.fn(actual, 2, 7);
                    assert.deepStrictEqual(actual, expected);
                });

                it('should sort pseudo-random integer arrays of various sizes', function () {
                    const lcg = createLcg(42);
                    for (const size of [3, 7, 15, 32, 63, 128, 500]) {
                        const original = Array.from({ length: size }, () => Math.floor(lcg() * 1000 - 500));
                        const actual = [...original];
                        const expected = [...original].sort((a, b) => a - b);
                        sorter.fn(actual);
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
        { name: 'radixBitSorterNumber', fn: (arr, s, e) => radixBitSorterNumber(arr, s, e) },
    ];

    const standardNumberVectors = [
        ...standardIntVectors,
        { name: 'floating point numbers', data: [3.14, 2.71, -1.41, 0.577, -0.0, 1.73] },
        { name: 'close decimal values', data: [0.001, 0.0001, 0.00005, -0.0001, -0.001] },
        { name: 'mixed integer and floats', data: [-10.5, 10, 0, -2.2, 3.8, -15, 8.1] },
    ];

    describe('Number / Floating Point Sorters Correctness', function () {
        for (const sorter of numberSorters) {
            describe(`${sorter.name}`, function () {
                for (const vector of standardNumberVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const actual = [...vector.data];
                        const expected = [...vector.data].sort((a, b) => a - b);
                        sorter.fn(actual);
                        assert.deepStrictEqual(actual, expected);
                    });
                }

                it('should correctly sort a subslice [2, 6)', function () {
                    const original = [99.9, 88.8, 15.5, 3.2, 42.1, 8.7, 77.7];
                    const actual = [...original];
                    const expectedSub = original.slice(2, 6).sort((a, b) => a - b);
                    const expected = [99.9, 88.8, ...expectedSub, 77.7];

                    sorter.fn(actual, 2, 6);
                    assert.deepStrictEqual(actual, expected);
                });

                it('should sort pseudo-random float arrays', function () {
                    const lcg = createLcg(99);
                    for (const size of [3, 7, 16, 64, 250]) {
                        const original = Array.from({ length: size }, () => (lcg() * 2000 - 1000));
                        const actual = [...original];
                        const expected = [...original].sort((a, b) => a - b);
                        sorter.fn(actual);
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
        { name: 'sortObjectInt', fn: (arr, mapper, s, e) => sortObjectInt(arr, mapper, s, e), stable: false },
        { name: 'radixBitSorterObjectInt', fn: (arr, mapper, s, e) => radixBitSorterObjectInt(arr, mapper, s, e), stable: true },
        { name: 'radixBitSorterObjectIntV2', fn: (arr, mapper, s, e) => radixBitSorterObjectIntV2(arr, mapper, s, e), stable: true },
        { name: 'quickBitSorterObjectInt', fn: (arr, mapper, s, e) => quickBitSorterObjectInt(arr, mapper, s, e), stable: true },
        { name: 'quickBitSorterObjectIntLowMem', fn: (arr, mapper, s, e) => quickBitSorterObjectIntLowMem(arr, mapper, s, e), stable: true },
        { name: 'pCountBitSorterObjectInt', fn: (arr, mapper, s, e) => pCountBitSorterObjectInt(arr, mapper, s, e), stable: true },
    ];

    describe('Object Sorters (Integer) Correctness & Identity Preservation', function () {
        for (const sorter of objectIntSorters) {
            describe(`${sorter.name}`, function () {
                it('should sort array of objects by custom mapper function', function () {
                    const original = [
                        { key: 30, payload: 'c' },
                        { key: 10, payload: 'a' },
                        { key: 20, payload: 'b' }
                    ];
                    const actual = [...original];
                    sorter.fn(actual, x => x.key);

                    assert.strictEqual(actual[0], original[1]); // {key: 10}
                    assert.strictEqual(actual[1], original[2]); // {key: 20}
                    assert.strictEqual(actual[2], original[0]); // {key: 30}
                });

                for (const vector of standardIntVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const original = vector.data.map((val, idx) => ({ key: val, idx }));
                        const actual = [...original];
                        sorter.fn(actual, x => x.key);
                        const actualKeys = actual.map(x => x.key);
                        const expectedKeys = vector.data.slice().sort((a, b) => a - b);
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
                        const expectedKeys = original.map(x => x.key).sort((a, b) => a - b);
                        sorter.fn(actual, x => x.key);
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
                    sorter.fn(actual, x => x.key, 1, 4);

                    assert.strictEqual(actual[0].id, 'keep-0');
                    assert.strictEqual(actual[1].id, 'sub-2'); // 10
                    assert.strictEqual(actual[2].id, 'sub-3'); // 30
                    assert.strictEqual(actual[3].id, 'sub-1'); // 50
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
                        sorter.fn(actual, x => x.key);

                        assert.deepStrictEqual(actual, [
                            { key: 1, order: 2 },
                            { key: 1, order: 4 },
                            { key: 2, order: 1 },
                            { key: 2, order: 3 },
                            { key: 2, order: 5 }
                        ]);
                    });
                }
            });
        }
    });

    // -------------------------------------------------------------------------
    // 4. Object Sorters (Float Values)
    // -------------------------------------------------------------------------
    const objectNumberSorters = [
        { name: 'radixBitSorterObjectNumber', fn: (arr, mapper, s, e) => radixBitSorterObjectNumber(arr, mapper, s, e) },
    ];

    describe('Object Sorters (Float Number) Correctness', function () {
        for (const sorter of objectNumberSorters) {
            describe(`${sorter.name}`, function () {
                for (const vector of standardNumberVectors) {
                    it(`should sort ${vector.name}`, function () {
                        const original = vector.data.map((val, idx) => ({ score: val, idx }));
                        const actual = [...original];
                        sorter.fn(actual, x => x.score);
                        const actualScores = actual.map(x => x.score);
                        const expectedScores = vector.data.slice().sort((a, b) => a - b);
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
                        const expectedScores = original.map(x => x.score).sort((a, b) => a - b);
                        sorter.fn(actual, x => x.score);
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
                    sorter.fn(actual, x => x.score, 1, 4);

                    assert.strictEqual(actual[0].id, 'keep-0');
                    assert.strictEqual(actual[1].id, 'sub-2'); // 1.1
                    assert.strictEqual(actual[2].id, 'sub-3'); // 3.3
                    assert.strictEqual(actual[3].id, 'sub-1'); // 5.5
                    assert.strictEqual(actual[4].id, 'keep-4');
                });
            });
        }
    });

});

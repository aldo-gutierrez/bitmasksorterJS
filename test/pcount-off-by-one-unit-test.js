import assert from 'assert';
import { pCountBitSorterInt } from '../main.js';

describe('PCountBitSorterInt Off-by-one Bucket Tests', function () {
    it('sorts array with multiple elements in the highest bucket (small range 0..7)', function () {
        const arr = [7, 0, 7, 1, 7, 3, 2];
        const expected = [...arr].sort((a, b) => a - b);
        pCountBitSorterInt(arr);
        assert.deepStrictEqual(arr, expected);
    });

    it('sorts array with highest and lowest keys present (range 0..15)', function () {
        const arr = [15, 0, 15, 15, 0, 8, 15];
        const expected = [...arr].sort((a, b) => a - b);
        pCountBitSorterInt(arr);
        assert.deepStrictEqual(arr, expected);
    });

    it('sorts subslice containing highest-bucket items only', function () {
        const original = [99, 15, 0, 15, 77];
        const actual = [...original];
        const expectedSub = original.slice(1, 4).sort((a, b) => a - b);
        const expected = [99, ...expectedSub, 77];

        pCountBitSorterInt(actual, 1, 4);
        assert.deepStrictEqual(actual, expected);
    });
});
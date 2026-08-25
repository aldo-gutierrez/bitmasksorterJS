import assert from 'assert';
import {
    sortInt32,
    radixBitSortInt32,
    quickBitSortInt32,
    pCountBitSortInt32,
    pCountBitMinMaxSortInt32,
    americanFlagBitSortInt32,
    sortFloat64,
    radixBitSortFloat64,
    sortObjectByInt32Key,
    radixBitSortObjectByInt32Key,
    radixBitV2SortObjectByInt32Key,
    quickBitSortObjectByInt32Key,
    quickBitLowMemSortObjectByInt32Key,
    pCountSortObjectByInt32Key,
    sortObjectByFloat64Key,
    radixBitSortObjectByFloat64Key
} from '../src/main.js';
import { getMaskRangeBits, getSortOptions } from '../src/utils/sorter-utils.js';

describe('Regression & Bug Fix Tests', function () {

    describe('Sort option parsing', function () {
        it('should default nulls to ignore and parse first/last/ignore', function () {
            assert.deepStrictEqual(getSortOptions({ nulls: 'last'}), { start: undefined, endP1: undefined, asc: true, nulls: 'last' });
            assert.deepStrictEqual(getSortOptions({ nulls: 'first' }), { start: undefined, endP1: undefined, asc: true, nulls: 'first' });
            assert.deepStrictEqual(getSortOptions({ nulls: 'ignore' }), { start: undefined, endP1: undefined, asc: true, nulls: 'ignore' });
            assert.deepStrictEqual(getSortOptions({}), { start: undefined, endP1: undefined, asc: true, nulls: 'ignore' });
        });
    });

    describe('Bug 2: sortObjectInt with Custom Mapper and N < 512', function () {
        it('should sort by custom mapper (not hardcoded .id)', function () {
            let items = [{ val: 30 }, { val: 10 }, { val: 20 }];
            sortObjectByInt32Key(items, x => x.val);
            assert.deepStrictEqual(items, [{ val: 10 }, { val: 20 }, { val: 30 }]);
        });

        it('should sort subslice only and leave elements outside [start, endP1) untouched', function () {
            let items = [{ val: 99 }, { val: 3 }, { val: 1 }, { val: 2 }, { val: 88 }];
            sortObjectByInt32Key(items, x => x.val, { start: 1, end: 4 });
            assert.deepStrictEqual(items, [
                { val: 99 },
                { val: 1 },
                { val: 2 },
                { val: 3 },
                { val: 88 }
            ]);
        });
    });

    describe('Bug 3: getMaskRangeBits 32-bit Shift Overflow', function () {
        it('should return -1 (0xFFFFFFFF) for 32-bit range (bStart=31, bEnd=0)', function () {
            let mask = getMaskRangeBits(31, 0);
            assert.strictEqual(mask, -1);
        });

        it('should return correct masks for other ranges', function () {
            assert.strictEqual(getMaskRangeBits(0, 0), 1);
            assert.strictEqual(getMaskRangeBits(3, 0), 15);
            assert.strictEqual(getMaskRangeBits(7, 4), 0xF0);
            assert.strictEqual(getMaskRangeBits(30, 0), 0x7FFFFFFF);
        });
    });

    describe('Bug 5: pCountBitMinMaxSortInt32 with 0 min or max', function () {
        it('should sort correctly when min is 0', function () {
            let arr = [0, 5, 2, 8, 0, 1];
            pCountBitMinMaxSortInt32(arr, { start: 0, end: 6 }, 0, 8);
            assert.deepStrictEqual(arr, [0, 0, 1, 2, 5, 8]);
        });

        it('should sort correctly when max is 0', function () {
            let arr = [-5, -2, -8, 0, -1];
            pCountBitMinMaxSortInt32(arr, { start: 0, end: 5 }, -8, 0);
            assert.deepStrictEqual(arr, [-8, -5, -2, -1, 0]);
        });
    });

    describe('Bug 6: Subslice Sorting with start > 0 in Object Sorters', function () {
        it('radixBitSorterObjectIntV2 should sort only subslice [1, 4)', function () {
            let arr = [{ val: 99 }, { val: 3 }, { val: 1 }, { val: 2 }, { val: 88 }];
            radixBitV2SortObjectByInt32Key(arr, x => x.val, { start: 1, end: 4 });
            assert.deepStrictEqual(arr, [
                { val: 99 },
                { val: 1 },
                { val: 2 },
                { val: 3 },
                { val: 88 }
            ]);
        });

        it('radixBitSorterObjectNumber should sort only subslice [1, 4)', function () {
            let arr = [{ val: 99.9 }, { val: 3.3 }, { val: 1.1 }, { val: 2.2 }, { val: 88.8 }];
            radixBitSortObjectByFloat64Key(arr, x => x.val, { start: 1, end: 4 });
            assert.deepStrictEqual(arr, [
                { val: 99.9 },
                { val: 1.1 },
                { val: 2.2 },
                { val: 3.3 },
                { val: 88.8 }
            ]);
        });

        it('quickBitSorterObjectInt should sort only subslice [1, 4)', function () {
            let arr = [{ val: 99 }, { val: 3 }, { val: 1 }, { val: 2 }, { val: 88 }];
            quickBitSortObjectByInt32Key(arr, x => x.val, { start: 1, end: 4 });
            assert.deepStrictEqual(arr, [
                { val: 99 },
                { val: 1 },
                { val: 2 },
                { val: 3 },
                { val: 88 }
            ]);
        });

        it('pCountSortObjectByInt32Key should sort only subslice [1, 4)', function () {
            let arr = [{ val: 99 }, { val: 3 }, { val: 1 }, { val: 2 }, { val: 88 }];
            pCountSortObjectByInt32Key(arr, x => x.val, { start: 1, end: 4 });
            assert.deepStrictEqual(arr, [
                { val: 99 },
                { val: 1 },
                { val: 2 },
                { val: 3 },
                { val: 88 }
            ]);
        });
    });

    describe('Bug 7: Preserving Object References with NaNs, Nulls, Undefined', function () {
        it.skip('radixBitSorterObjectIntV2 should keep object references and position nulls/undefined/NaNs', function () {
            let o1 = { id: 3 };
            let o2 = { id: 1 };
            let o3 = { id: NaN };
            let arr = [o1, null, o2, o3, undefined];
            radixBitV2SortObjectByInt32Key(arr, x => x ? x.id : x);
            
            // Valid elements sorted first, NaN objects next, nulls/undefined at the end
            assert.strictEqual(arr[0], o); // {id: 1}
            assert.strictEqual(arr[1], o1); // {id: 3}
            assert.strictEqual(arr[2], o3); // {id: NaN}
            assert.strictEqual(arr[3], null);
            assert.strictEqual(arr[4], undefined);
        });

        it.skip('radixBitSorterObjectNumber should keep object references with floats and NaNs', function () {
            let o1 = { id: 3.5 };
            let o2 = { id: 1.2 };
            let o3 = { id: NaN };
            let arr = [o1, null, o2, o3, undefined];
            radixBitSortObjectByFloat64Key(arr, x => x ? x.id : x);

            assert.strictEqual(arr[0], o2); // {id: 1.2}
            assert.strictEqual(arr[1], o1); // {id: 3.5}
            assert.strictEqual(arr[2], o3); // {id: NaN}
            assert.strictEqual(arr[3], null);
            assert.strictEqual(arr[4], undefined);
        });
    });
});

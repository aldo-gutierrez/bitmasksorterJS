import assert from 'assert';
import {sort} from '../src/utils/sort.js';

describe('sort wrapper parameter dispatch', function () {
    it('dispatches mapper sorts using the explicit options.type', function () {
        const items = [
            {id: 3},
            {id: 1},
            {id: 2}
        ];

        sort(items, x => x.id, {type: 'int32', order: 'asc'});

        assert.deepStrictEqual(items.map(x => x.id), [1, 2, 3]);
    });

    it('dispatches float64 mapper sorts when the type is float64', function () {
        const items = [
            {id: 3.5},
            {id: 1.1},
            {id: 2.2}
        ];

        sort(items, x => x.id, {type: 'float64', order: 'asc'});

        assert.deepStrictEqual(items.map(x => x.id), [1.1, 2.2, 3.5]);
    });

    it('inverts the spec order so the first key remains the primary key', function () {
        const items = [
            {id: 2, group: 2},
            {id: 1, group: 2},
            {id: 1, group: 1},
            {id: 2, group: 1}
        ];

        sort(items, [
            {key: x => x.id, type: 'int32'},
            {key: x => x.group, type: 'int32'}
        ], {order: 'asc'});

        assert.deepStrictEqual(items.map(x => [x.id, x.group]), [
            [1, 1],
            [1, 2],
            [2, 1],
            [2, 2]
        ]);
    });

    it('defaults to numeric sort for plain number arrays when no parameters provided', function () {
        const arr = [3, 1, 2];
        sort(arr);
        assert.deepStrictEqual(arr, [1, 2, 3]);
    });

    it('handles typed arrays: Float64Array -> float path, Int32Array -> int path', function () {
        const f = new Float64Array([3.1, 1.2, 2.3]);
        sort(f);
        assert.deepStrictEqual(Array.from(f), [1.2, 2.3, 3.1]);

        const i = new Int32Array([3, 1, 2]);
        sort(i);
        assert.deepStrictEqual(Array.from(i), [1, 2, 3]);
    });

    it('throws on invalid parameter types', function () {
        const items = [{id:1}];
        assert.throws(() => sort(items, 123));
        assert.doesNotThrow(() => sort(items, [1,2,3], {}));
        assert.throws(() => sort(items, x => x.id, "notObject"));
    });

    it('handles nulls last with start/end options', function () {
        const items2 = [
            {id: null},
            {id: 2},
            {id: 1},
            {id: null},
            {id: 3},
            {id: undefined}
        ];

        sort(items2, x => x.id, {order: 'asc', nulls: 'last'});
        assert.deepStrictEqual(items2.map(x => x ? x.id : x), [1, 2, 3, null, null, undefined]);
    });

    it('sorts subranges with start/end options', function () {
        const arr = [9, 7, 8, 1, 2];
        sort(arr, {start: 1, end: 4});
        assert.deepStrictEqual(arr, [9, 1, 7, 8, 2]);
    });

    it('supports per-field order overrides in multi-field specs', function () {
        const items = [
            {a:1,b:2},
            {a:1,b:1},
            {a:2,b:1},
            {a:2,b:2},
            {a:1,b:3}
        ];

        sort(items, [
            {key: x => x.a, type: 'int32'},
            {key: x => x.b, type: 'int32', order: 'desc'}
        ], {order: 'asc'});

        assert.deepStrictEqual(items.map(x => [x.a, x.b]), [
            [1, 3],
            [1, 2],
            [1, 1],
            [2, 2],
            [2, 1]
        ]);
    });
});

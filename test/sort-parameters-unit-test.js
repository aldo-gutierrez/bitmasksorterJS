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
        const items = [{id:2},{id:1},{id:3}];
        assert.throws(() => sort(items, 123));
        assert.throws(() => sort(items, [1,2,3], {}));
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

    it('sorts strings in asc and desc order with nulls ignore, last and first', function () {
        const ascLast = [
            {value: 'b'},
            {value: null},
            {value: 'a'},
            {value: 'c'},
            {value: undefined}
        ];

        sort(ascLast, x => x.value, {order: 'asc', nulls: 'last'});
        assert.deepStrictEqual(ascLast.map(x => x ? x.value : x), ['a', 'b', 'c', null, undefined]);

        const descFirst = [
            {value: 'b'},
            {value: null},
            {value: 'a'},
            {value: 'c'},
            {value: undefined}
        ];

        sort(descFirst, x => x.value, {order: 'desc', nulls: 'first'});
        assert.deepStrictEqual(descFirst.map(x => x ? x.value : x), [null, 'c', 'b', 'a', undefined]);

        const ignore = [
            {value: 'b'},
            {value: 'a'},
            {value: 'c'}
        ];

        sort(ignore, x => x.value, {order: 'asc', nulls: 'ignore'});
        assert.deepStrictEqual(ignore.map(x => x.value), ['a', 'b', 'c']);

        sort(ignore, x => x.value, {order: 'desc', nulls: 'ignore'});
        assert.deepStrictEqual(ignore.map(x => x.value), ['c', 'b', 'a']);
    });

    it('sorts booleans in asc and desc order with null placement and range bounds', function () {
        const ascLast = [
            {value: true},
            {value: null},
            {value: false},
            {value: undefined},
            {value: true}
        ];

        sort(ascLast, x => x.value, {order: 'asc', nulls: 'last'});
        assert.deepStrictEqual(ascLast.map(x => x ? x.value : x), [false, true, true, null, undefined]);

        const descFirst = [
            {value: true},
            {value: null},
            {value: false},
            {value: undefined},
            {value: false}
        ];

        sort(descFirst, x => x.value, {order: 'desc', nulls: 'first'});
        assert.deepStrictEqual(descFirst.map(x => x ? x.value : x), [null, true, false, false, undefined]);

        const range = [true, true, false, true, false, false];
        sort(range, {type: 'boolean', start: 1, end: 5, order: 'asc'});
        assert.deepStrictEqual(range, [true, false, false, true, true, false]);
    });

    it('sorts dates in asc and desc order with null placement and range bounds', function () {
        const ascLast = [
            {value: new Date('2020-01-03')},
            {value: null},
            {value: new Date('2020-01-01')},
            {value: undefined},
            {value: new Date('2020-01-02')}
        ];

        sort(ascLast, x => x.value, {type: 'date', order: 'asc', nulls: 'last'});
        assert.deepStrictEqual(ascLast.map(x => x === null || x === undefined ? x : (x.value === null || x.value === undefined ? x.value : x.value.getTime())), [
            new Date('2020-01-01').getTime(),
            new Date('2020-01-02').getTime(),
            new Date('2020-01-03').getTime(),
            null,
            undefined
        ]);

        const descFirst = [
            {value: new Date('2020-01-03')},
            {value: null},
            {value: new Date('2020-01-01')},
            {value: undefined},
            {value: new Date('2020-01-02')}
        ];

        sort(descFirst, x => x.value, {type: 'date', order: 'desc', nulls: 'first'});
        assert.deepStrictEqual(descFirst.map(x => x === null || x === undefined ? x : (x.value === null || x.value === undefined ? x.value : x.value.getTime())), [
            null,
            new Date('2020-01-03').getTime(),
            new Date('2020-01-02').getTime(),
            new Date('2020-01-01').getTime(),
            undefined
        ]);

        const range = [
            new Date('2020-01-05'),
            new Date('2020-01-02'),
            new Date('2020-01-04'),
            new Date('2020-01-01'),
            new Date('2020-01-03'),
            new Date('2020-01-06')
        ];

        sort(range, {type: 'date', start: 1, end: 5, order: 'desc'});
        assert.deepStrictEqual(range.map(x => x.getTime()), [
            new Date('2020-01-05').getTime(),
            new Date('2020-01-04').getTime(),
            new Date('2020-01-03').getTime(),
            new Date('2020-01-02').getTime(),
            new Date('2020-01-01').getTime(),
            new Date('2020-01-06').getTime()
        ]);
    });

    it('sorts multiple text fields with primary and secondary key order overrides', function () {
        const items = [
            {first: 'b', last: 'alpha'},
            {first: 'a', last: 'zeta'},
            {first: 'a', last: 'alpha'},
            {first: 'b', last: 'beta'}
        ];

        sort(items, [
            {key: x => x.first, type: 'string'},
            {key: x => x.last, type: 'string', order: 'desc'}
        ], {order: 'asc', nulls: 'last'});

        assert.deepStrictEqual(items.map(x => [x.first, x.last]), [
            ['a', 'zeta'],
            ['a', 'alpha'],
            ['b', 'beta'],
            ['b', 'alpha']
        ]);
    });
});

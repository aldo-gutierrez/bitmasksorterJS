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
});

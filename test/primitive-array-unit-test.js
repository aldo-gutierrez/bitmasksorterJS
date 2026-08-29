import assert from 'assert';
import {sort} from '../src/utils/sort.js';

describe('primitive array sorting', function () {
    it('sorts string arrays using native string comparison', function () {
        const values = ['banana', 'apple', 'cherry'];
        sort(values);
        assert.deepStrictEqual(values, ['apple', 'banana', 'cherry']);
    });

    it('sorts boolean arrays in ascending and descending order', function () {
        const ascending = [true, false, true, false];
        sort(ascending);
        assert.deepStrictEqual(ascending, [false, false, true, true]);

        const descending = [true, false, true, false];
        sort(descending, {type: 'boolean', order: 'desc'});
        assert.deepStrictEqual(descending, [true, true, false, false]);
    });

    it('sorts date arrays by timestamp', function () {
        const values = [
            new Date('2025-03-01T00:00:00Z'),
            new Date('2024-12-31T00:00:00Z'),
            new Date('2025-01-01T00:00:00Z')
        ];

        sort(values, {type: 'date', order: 'asc'});
        assert.deepStrictEqual(values.map(value => value.getTime()), [
            new Date('2024-12-31T00:00:00Z').getTime(),
            new Date('2025-01-01T00:00:00Z').getTime(),
            new Date('2025-03-01T00:00:00Z').getTime()
        ]);
    });
});

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

    it('sorts uint32, int64 and uint64 typed arrays using their explicit type option', function () {
        const cases = [
            {
                values: new Uint32Array([7, 2, 9, 1, 5]),
                type: 'uint32',
                expected: [1, 2, 5, 7, 9]
            },
            {
                values: new BigInt64Array([7n, 2n, 9n, 1n, 5n]),
                type: 'int64',
                expected: [1n, 2n, 5n, 7n, 9n]
            },
            {
                values: new BigUint64Array([7n, 2n, 9n, 1n, 5n]),
                types: 'uint64',
                expected: [1n, 2n, 5n, 7n, 9n]
            }
        ];

        for (const {values, type, types, expected} of cases) {
            const optionTypes = types ?? [type];
            for (const optionType of optionTypes) {
                const actual = new (values.constructor)(values);
                sort(actual, {type: optionType, order: 'asc'});
                assert.deepStrictEqual(Array.from(actual), expected);
            }
        }
    });

    it('smoke tests sorting an array of typed arrays', function () {
        const typedArrays = [
            {values: new Uint32Array([9, 1, 3]), type: 'uint32', expected: [1, 3, 9]},
            {values: new BigInt64Array([9n, 1n, 3n]), type: 'int64', expected: [1n, 3n, 9n]},
            {values: new BigUint64Array([9n, 1n, 3n]), types: 'uint64', expected: [1n, 3n, 9n]}
        ];

        for (const {values, type, types, expected} of typedArrays) {
            const optionTypes = types ?? [type];
            for (const optionType of optionTypes) {
                const actual = new (values.constructor)(values);
                sort(actual, {type: optionType, order: 'asc'});
                assert.deepStrictEqual(Array.from(actual), expected);
            }
        }
    });

    it('sorts uint32, int64 and uint64 typed arrays using their explicit type option', function () {
        const cases = [
            {
                values: new Uint32Array([7, 2, 9, 1, 5]),
                type: 'uint32',
                expected: [1, 2, 5, 7, 9]
            },
            {
                values: new BigInt64Array([7n, 2n, 9n, 1n, 5n]),
                type: 'int64',
                expected: [1n, 2n, 5n, 7n, 9n]
            },
            {
                values: new BigUint64Array([7n, 2n, 9n, 1n, 5n]),
                types: 'uint64',
                expected: [1n, 2n, 5n, 7n, 9n]
            }
        ];

        for (const {values, type, types, expected} of cases) {
            const optionTypes = types ?? [type];
            for (const optionType of optionTypes) {
                const actual = new (values.constructor)(values);
                sort(actual, {type: optionType, order: 'asc'});
                assert.deepStrictEqual(Array.from(actual), expected);
            }
        }
    });

    it('smoke tests sorting an array of typed arrays', function () {
        const typedArrays = [
            {values: new Uint32Array([9, 1, 3]), type: 'uint32', expected: [1, 3, 9]},
            {values: new BigInt64Array([9n, 1n, 3n]), type: 'int64', expected: [1n, 3n, 9n]},
            {values: new BigUint64Array([9n, 1n, 3n]), types: 'uint64', expected: [1n, 3n, 9n]}
        ];

        for (const {values, type, types, expected} of typedArrays) {
            const optionTypes = types ?? [type];
            for (const optionType of optionTypes) {
                const actual = new (values.constructor)(values);
                sort(actual, {type: optionType, order: 'asc'});
                assert.deepStrictEqual(Array.from(actual), expected);
            }
        }
    });

    it('sorts bigint values beyond the float64 safe range without precision loss', function () {
        const values = new BigInt64Array([
            9223372036854775807n,
            9007199254740993n,
            -9007199254740993n,
            0n,
            9007199254740992n,
            -9007199254740992n,
            -9223372036854775808n,
            9223372036854775807n
        ]);

        sort(values, {type: 'int64', order: 'asc'});
        assert.deepStrictEqual(Array.from(values), [
            -9223372036854775808n,
            -9007199254740993n,
            -9007199254740992n,
            0n,
            9007199254740992n,
            9007199254740993n,
            9223372036854775807n,
            9223372036854775807n
        ]);

        const objs = [
            {id: 9007199254740993n},
            {id: -9007199254740993n},
            {id: 9007199254740992n},
            {id: 0n},
            {id: -9007199254740992n}
        ];

        sort(objs, x => x.id, {type: 'int64', order: 'asc'});
        assert.deepStrictEqual(objs.map(x => x.id), [
            -9007199254740993n,
            -9007199254740992n,
            0n,
            9007199254740992n,
            9007199254740993n
        ]);

        const autoDetected = [
            {id: 9007199254740993n},
            {id: -9007199254740993n},
            {id: 0n},
            {id: 9007199254740992n},
            {id: -9007199254740992n}
        ];
        sort(autoDetected, x => x.id);
        assert.deepStrictEqual(autoDetected.map(x => x.id), [
            -9007199254740993n,
            -9007199254740992n,
            0n,
            9007199254740992n,
            9007199254740993n
        ]);
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

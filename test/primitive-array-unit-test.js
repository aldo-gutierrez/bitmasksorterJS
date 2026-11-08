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

    describe('bigint subrange isolation', function () {
        const low = 9007199254740992n;
        const high = low + 1n;
        const cases = [
            {
                name: 'ascending',
                input: [high, high, low, low],
                expected: [high, low, high, low],
                options: {start: 1, end: 3, order: 'asc', type: 'bigint'}
            },
            {
                name: 'descending with inferred type',
                input: [low, low, high, high],
                expected: [low, high, low, high],
                options: {start: 1, end: 3, order: 'desc'}
            },
            {
                name: 'empty range',
                input: [high, low, high, low],
                expected: [high, low, high, low],
                options: {start: 1, end: 1, type: 'bigint'}
            },
            {
                name: 'single-element range',
                input: [high, low, high, low],
                expected: [high, low, high, low],
                options: {start: 1, end: 2, type: 'bigint'}
            },
            {
                name: 'mixed signs',
                input: [high, low, -30n, 10n, -20n, high],
                expected: [high, low, -30n, -20n, 10n, high],
                options: {start: 2, end: 5, type: 'bigint'}
            },
            {
                name: 'nulls first',
                input: [high, 3n, null, 1n, undefined, 2n, low],
                expected: [high, null, 1n, 2n, 3n, undefined, low],
                options: {start: 1, end: 6, type: 'bigint', nulls: 'first'}
            },
            {
                name: 'nulls last',
                input: [high, 3n, null, 1n, undefined, 2n, low],
                expected: [high, 1n, 2n, 3n, null, undefined, low],
                options: {start: 1, end: 6, type: 'bigint', nulls: 'last'}
            },
            {
                name: 'normalized descending order',
                input: [low, low, high, high],
                expected: [low, high, low, high],
                options: {start: 1, end: 3, type: 'bigint', order: 'DESC'}
            }
        ];

        for (const {name, input, expected, options} of cases) {
            it(`sorts an ordinary array: ${name}`, function () {
                const actual = input.slice();
                sort(actual, {...options});
                assert.deepStrictEqual(actual, expected);
            });

            it(`sorts object keys: ${name}`, function () {
                const actual = input.map((key, index) => ({key, index}));
                const original = actual.slice();
                sort(actual, item => item.key, {...options});
                assert.deepStrictEqual(actual.map(item => item.key), expected);
                for (let i = 0; i < actual.length; i++) {
                    if (i < options.start || i >= options.end) {
                        assert.strictEqual(actual[i], original[i]);
                    }
                }
            });
        }

        it('sorts typed array subranges without changing their boundaries', function () {
            for (const type of [BigInt64Array, BigUint64Array]) {
                const actual = new type([high, high, low, low]);
                sort(actual, {start: 1, end: 3});
                assert.deepStrictEqual(Array.from(actual), [high, low, high, low]);
            }
        });

        it('preserves secondary-key order for equal bigint keys within the range', function () {
            const actual = [
                {key: high, name: 'outside first'},
                {key: high, name: 'z'},
                {key: low, name: 'b'},
                {key: low, name: 'a'},
                {key: low, name: 'outside last'}
            ];
            const original = actual.slice();
            sort(actual, [
                {key: item => item.key, type: 'bigint'},
                {key: item => item.name, type: 'string'}
            ], {start: 1, end: 4});
            assert.deepStrictEqual(actual, [original[0], original[3], original[2], original[1], original[4]]);
        });
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

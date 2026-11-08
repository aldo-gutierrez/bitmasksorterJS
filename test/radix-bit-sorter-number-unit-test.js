import assert from 'assert';
import {radixBitSortFloat64} from '../src/algorithms/radix-bit-sorter-number.js';

describe('Radix number sort with same-sign values', function () {
    const cases = [
        {
            name: 'positive BigInt64Array',
            type: BigInt64Array,
            input: [9007199254740993n, 1n, 9223372036854775807n, 4294967296n, 42n, 1n],
            ascending: [1n, 1n, 42n, 4294967296n, 9007199254740993n, 9223372036854775807n],
            sentinel: 17n
        },
        {
            name: 'negative BigInt64Array',
            type: BigInt64Array,
            input: [-1n, -9007199254740993n, -9223372036854775808n, -42n, -4294967296n, -1n],
            ascending: [-9223372036854775808n, -9007199254740993n, -4294967296n, -42n, -1n, -1n],
            sentinel: 17n
        },
        {
            name: 'BigUint64Array spanning the high bit',
            type: BigUint64Array,
            input: [18446744073709551615n, 1n, 9223372036854775808n, 4294967296n, 0n, 1n],
            ascending: [0n, 1n, 1n, 4294967296n, 9223372036854775808n, 18446744073709551615n],
            sentinel: 17n
        },
        {
            name: 'BigUint64Array above the signed limit',
            type: BigUint64Array,
            input: [18446744073709551615n, 9223372036854775809n, 9223372036854775808n],
            ascending: [9223372036854775808n, 9223372036854775809n, 18446744073709551615n],
            sentinel: 17n
        },
        ...[Array, Float64Array].flatMap(type => [
            {
                name: `positive ${type.name}`,
                type,
                input: [3.5, 0.125, 0, 1024.25, 1.5, 0.125],
                ascending: [0, 0.125, 0.125, 1.5, 3.5, 1024.25],
                sentinel: 17
            },
            {
                name: `negative ${type.name} including -0`,
                type,
                input: [-1.5, -0, -1024.25, -0.125, -3.5],
                ascending: [-1024.25, -3.5, -1.5, -0.125, -0],
                sentinel: 17
            },
            {
                name: `${type.name} with signed zeros`,
                type,
                input: [0, -0, 0, -0],
                ascending: [-0, -0, 0, 0],
                sentinel: 17
            }
        ])
    ];

    for (const {name, type, input, ascending, sentinel} of cases) {
        for (const order of ['asc', 'desc']) {
            const expected = order === 'asc' ? ascending : ascending.slice().reverse();

            it(`sorts ${name} in ${order} order`, function () {
                const actual = type === Array ? input.slice() : new type(input);
                radixBitSortFloat64(actual, {order});
                assert.deepStrictEqual(Array.from(actual), expected);
            });

            it(`sorts a ${name} subrange in ${order} order`, function () {
                const values = [sentinel, ...input, sentinel];
                const actual = type === Array ? values : new type(values);
                radixBitSortFloat64(actual, {start: 1, end: values.length - 1, order});
                assert.deepStrictEqual(Array.from(actual), [sentinel, ...expected, sentinel]);
            });

            if (type !== Array) {
                it(`sorts a ${name} view in ${order} order`, function () {
                    const backing = new type([sentinel, ...input, sentinel]);
                    radixBitSortFloat64(backing.subarray(1, -1), {order});
                    assert.deepStrictEqual(Array.from(backing), [sentinel, ...expected, sentinel]);
                });
            }
        }
    }
});

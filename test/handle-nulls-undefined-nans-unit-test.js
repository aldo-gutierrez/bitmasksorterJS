import assert from "node:assert/strict";
import { handleNullsUndefinedAndNans } from "../src/utils/sorter-utils.js";

describe("handleNullsUndefinedAndNans", function () {
    it("returns typed arrays unchanged when no mapper is provided", function () {
        const array = new Int32Array([3, 1, 2]);

        const result = handleNullsUndefinedAndNans(
            array,
            "last",
            0,
            array.length
        );

        assert.equal(result.arrayNative, array);
        assert.deepStrictEqual(result, {
            start: 0,
            endP1: 3,
            arrayNative: array,
            start2: 0,
            end2: 3
        });
        assert.deepStrictEqual(Array.from(array), [3, 1, 2]);
    });

    it("uses the mapper for typed arrays when one is provided", function () {
        const array = new Int32Array([3, 1, 2]);
        const mapped = [];

        const result = handleNullsUndefinedAndNans(
            array,
            "last",
            0,
            array.length,
            (value) => {
                mapped.push(value);
                return value;
            }
        );

        assert.deepStrictEqual(mapped, [3, 1, 2]);
        assert.equal(result.arrayNative, undefined);
        assert.deepStrictEqual(Array.from(array), [3, 1, 2]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [0, 3, 0, 3]
        );
    });

    it("leaves values unchanged for ignore without a native-array factory", function () {
        const array = [3, null, undefined, NaN, 1];

        const result = handleNullsUndefinedAndNans(
            array,
            "ignore",
            0,
            array.length
        );

        assert.equal(result.arrayNative, array);
        assert.equal(result.start, 0);
        assert.equal(result.endP1, array.length);
        assert.equal(result.start2, 0);
        assert.equal(result.end2, array.length);
        assert.deepStrictEqual(array, [3, null, undefined, NaN, 1]);
    });

    it("copies the requested range for ignore with a native-array factory and no mapper", function () {
        const array = [99, 3, null, undefined, NaN, 1, 88];

        const result = handleNullsUndefinedAndNans(
            array,
            "ignore",
            1,
            6,
            undefined,
            (length) => new Array(length)
        );

        assert.deepStrictEqual(result.arrayNative, [3, null, undefined, NaN, 1]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [1, 6, 1, 6]
        );
        assert.deepStrictEqual(array, [99, 3, null, undefined, NaN, 1, 88]);
    });

    it("maps every value for ignore without treating mapped nullish values specially", function () {
        const array = [
            { key: 3 },
            { key: null },
            { key: undefined },
            { key: NaN },
            { key: 1 }
        ];
        const original = array.slice();

        const result = handleNullsUndefinedAndNans(
            array,
            "ignore",
            0,
            array.length,
            (value) => value.key,
            (length) => new Array(length)
        );

        assert.deepStrictEqual(result.arrayNative, [3, null, undefined, NaN, 1]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [0, 5, 0, 5]
        );
        assert.deepStrictEqual(array, original);
    });

    it("compacts regular values and moves all exceptional values to the end", function () {
        const nullKey = { key: null, id: "null-key" };
        const undefinedKey = { key: undefined, id: "undefined-key" };
        const nanKey = { key: NaN, id: "nan-key" };
        const valueThree = { key: 3, id: "three" };
        const valueOne = { key: 1, id: "one" };
        const array = [
            valueThree,
            null,
            undefined,
            NaN,
            nullKey,
            undefinedKey,
            nanKey,
            valueOne
        ];
        const mapperCalls = [];

        const result = handleNullsUndefinedAndNans(
            array,
            "last",
            0,
            array.length,
            (value) => {
                mapperCalls.push(value);
                return value.key;
            },
            (length) => new Array(length)
        );

        assert.deepStrictEqual(array, [
            valueThree,
            valueOne,
            nanKey,
            nullKey,
            undefinedKey,
            NaN,
            null,
            undefined
        ]);
        assert.deepStrictEqual(result.arrayNative.slice(0, result.endP1), [3, 1]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [0, 2, 0, 5]
        );
        assert.deepStrictEqual(mapperCalls, [
            valueThree,
            nullKey,
            undefinedKey,
            nanKey,
            valueOne
        ]);
    });

    it("handles direct exceptional values without a mapper and fills the native array", function () {
        const array = [3, null, undefined, NaN, 1];

        const result = handleNullsUndefinedAndNans(
            array,
            "last",
            0,
            array.length,
            undefined,
            (length) => new Array(length)
        );

        assert.deepStrictEqual(array, [3, 1, NaN, null, undefined]);
        assert.deepStrictEqual(result.arrayNative.slice(0, result.endP1), [3, 1]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [0, 2, 0, 2]
        );
    });

    it("puts leading nulls first and preserves the order of mixed exceptional values", function () {
        const nullKey = { key: null, id: "null-key" };
        const undefinedKey = { key: undefined, id: "undefined-key" };
        const nanKey = { key: NaN, id: "nan-key" };
        const valueThree = { key: 3, id: "three" };
        const valueOne = { key: 1, id: "one" };
        const array = [
            null,
            valueThree,
            nullKey,
            undefined,
            nanKey,
            NaN,
            valueOne,
            undefinedKey
        ];

        const result = handleNullsUndefinedAndNans(
            array,
            "first",
            0,
            array.length,
            (value) => value.key,
            (length) => new Array(length)
        );

        assert.deepStrictEqual(array, [
            null,
            nullKey,
            valueThree,
            valueOne,
            nanKey,
            undefinedKey,
            NaN,
            undefined
        ]);
        assert.deepStrictEqual(result.arrayNative.slice(0, result.endP1 - result.start), [3, 1]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [2, 4, 1, 6]
        );
    });

    it("puts nulls first without a mapper, including nulls found after the first value", function () {
        const array = [null, 3, undefined, NaN, null, 1];

        const result = handleNullsUndefinedAndNans(
            array,
            "first",
            0,
            array.length
        );

        assert.deepStrictEqual(array, [null, null, 3, 1, NaN, undefined]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [2, 4, 2, 4]
        );
        assert.equal(result.arrayNative, undefined);
    });

    it("returns an empty sortable range when every value is a leading null", function () {
        const array = [null, null];

        const result = handleNullsUndefinedAndNans(
            array,
            "first",
            0,
            array.length,
            undefined,
            (length) => new Array(length)
        );

        assert.deepStrictEqual(array, [null, null]);
        assert.deepStrictEqual(result.arrayNative, []);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [2, 2, 2, 2]
        );
    });

    it("leaves values in place for first when no nulls need to be moved", function () {
        const first = { key: 3 };
        const second = { key: 1 };
        const array = [first, second];

        const result = handleNullsUndefinedAndNans(
            array,
            "first",
            0,
            array.length,
            (value) => value.key,
            (length) => new Array(length)
        );

        assert.deepStrictEqual(array, [first, second]);
        assert.deepStrictEqual(result.arrayNative, [3, 1]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [0, 2, 0, 2]
        );
    });

    it("keeps values outside the selected range untouched", function () {
        const array = [null, 9, undefined, 3, NaN, null, 8];

        const result = handleNullsUndefinedAndNans(
            array,
            "last",
            1,
            6,
            undefined,
            (length) => new Array(length)
        );

        assert.deepStrictEqual(array, [null, 9, 3, NaN, null, undefined, 8]);
        assert.deepStrictEqual(result.arrayNative.slice(0, result.endP1 - result.start), [9, 3]);
        assert.deepStrictEqual(
            [result.start, result.endP1, result.start2, result.end2],
            [1, 3, 1, 3]
        );
    });
});

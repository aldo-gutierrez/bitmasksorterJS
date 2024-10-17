import assert from 'assert';
import {partitionStableLowMemInt} from "../sorter-utils-object-int.js";
import {partitionReverseStableLowMemInt} from "../sorter-utils-object-int.js";
import {testArraysEquals} from "./test-utils.js";

let onError = (firstError) =>  {
    console.log(`Arrays Not Equal + error:  ${JSON.stringify(firstError)}`);
    assert.fail("1");
}

describe('Basic Function Test', function () {
    describe('partitionStableLowMemInt', function () {
        it('smoke test', function () {

            let array = [0, 1, 0, 1, 0, 1, 0, 1];
            partitionStableLowMemInt(array, 0, array.length, 1, (x) => x);
            let expected = [0, 0, 0, 0, 1, 1, 1, 1];
            testArraysEquals(expected, array, onError);

            array = [1, 0, 0, 0, 0, 1, 0, 1];
            partitionStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [0, 0, 0, 0, 0, 1, 1, 1];
            testArraysEquals(expected, array, onError);

            array = [1, 0, 1, 1, 1, 1, 0, 1];
            partitionStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [0, 0, 1, 1, 1, 1, 1, 1];
            testArraysEquals(expected, array, onError);

            array = [1, 1, 1, 1, 1, 1, 1, 1];
            partitionStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [1, 1, 1, 1, 1, 1, 1, 1];
            testArraysEquals(expected, array, onError);

            array = [0, 0, 0, 0, 0, 0, 0, 0];
            partitionStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [0, 0, 0, 0, 0, 0, 0, 0];
            testArraysEquals(expected, array, onError);
        });
    });
    describe('partitionReverseStableLowMemInt', function () {
        it('smoke test', function () {

            let array = [0, 1, 0, 1, 0, 1, 0, 1];
            partitionReverseStableLowMemInt(array, 0, array.length, 1, (x) => x);
            let expected = [1, 1, 1, 1, 0, 0, 0, 0];
            testArraysEquals(expected, array, onError);

            array = [1, 0, 0, 0, 0, 1, 0, 1];
            partitionReverseStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [1, 1, 1, 0, 0, 0, 0, 0];
            testArraysEquals(expected, array, onError);

            array = [1, 0, 1, 1, 1, 1, 0, 1];
            partitionReverseStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [1, 1, 1, 1, 1, 1, 0, 0];
            testArraysEquals(expected, array, onError);

            array = [1, 1, 1, 1, 1, 1, 1, 1];
            partitionReverseStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [1, 1, 1, 1, 1, 1, 1, 1];
            testArraysEquals(expected, array, onError);

            array = [0, 0, 0, 0, 0, 0, 0, 0];
            partitionReverseStableLowMemInt(array, 0, array.length, 1, (x) => x);
            expected = [0, 0, 0, 0, 0, 0, 0, 0];
            testArraysEquals(expected, array, onError);
        });
    });
});
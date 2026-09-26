import {
    arrayCopy, arrayCopyTypedArray,
    calculateSumOffsets,
    getSections,
    getSortOptions,
    handleNullsUndefinedAndNans,
    validateSortRange
} from "../utils/sorter-utils.js";
import {calculateMaskInt, partitionNotStable, partitionReverseNotStableUpperBit} from "../utils/sorter-utils-int.js";
import { getMaskAsArray } from "../utils/sorter-utils.js";
import {isTypedArray} from "../utils/utils.js";

export function radixBitSortInt32(array, options = {}) {
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let arrayWasTyped = isTypedArray(array);
    let arrayTyped = arrayWasTyped ? array : new Int32Array(array);

    let mask = options.mask ?? calculateMaskInt(arrayTyped, start, endP1);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }
    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = asc ? partitionReverseNotStableUpperBit(arrayTyped, start, endP1)
            : partitionNotStable(arrayTyped, start, endP1, 1 << 31);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let mask1 = 0;
        let mask2 = 0;
        if (n1 > 1) { //sort negative numbers
            mask1 = calculateMaskInt(arrayTyped, start, finalLeft);
            if (mask1 === 0) {
                n1 = 0;
            }
        }
        if (n2 > 1) { //sort positive numbers
            mask2 = calculateMaskInt(arrayTyped, finalLeft, endP1);
            if (mask2 === 0) {
                n2 = 0;
            }
        }
        let aux = new arrayTyped.constructor(Math.max(n1, n2));
        if (n1 > 1) {
            bList = getMaskAsArray(mask1);
            radixSortInt(asc, arrayTyped, start, finalLeft, bList, aux);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            radixSortInt(asc, arrayTyped, finalLeft, endP1, bList, aux);
        }
    } else {
        let aux = new arrayTyped.constructor(endP1 - start);
        radixSortInt(asc, arrayTyped, start, endP1, bList, aux);
    }

    if (!arrayWasTyped) {
        arrayCopy(arrayTyped, start, array, start, endP1 - start);
    }
}

export function partitionReverseStableInt(array, start, endP1, mask, aux) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        if (!((element & mask) === 0)) {
            array[left] = array[i];
            left++;
        } else {
            aux[right] = array[i];
            right++;
        }
    }
    arrayCopy(aux, 0, array, left, right);
    return left;
}

function partitionStableInt(array, start, endP1, mask, aux) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        if ((element & mask) === 0) {
            array[left] = element;
            left++;
        } else {
            aux[right] = element;
            right++;
        }
    }
    arrayCopy(aux, 0, array, left, right);
    return left;
}

function partitionStableLastBitsInt(asc, array, start, n, section, aux, startAux) {
    const range = section.range;
    const mask = section.mask;
    const count = new Int32Array(range);
    const endP1 = start + n;
    for (let i = start; i < endP1; i++) {
        count[array[i] & mask]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[element & mask]++ +startAux] = element;
    }
}

function partitionStableGroupBitsInt(asc, array, start, n, section, aux, startAux) {
    const mask = section.mask;
    const shift = section.shift;
    const range = section.range;
    const count = new Int32Array(range);
    const endP1 = start + n;
    for (let i = start; i < endP1; i++) {
        count[(array[i] & mask) >> shift]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[(element & mask) >> shift]++ +startAux] = element;
    }
}

function radixSortInt(asc, array, start, endP1, bList, aux) {
    let sections = getSections(bList);
    let startAux = 0;
    let n = endP1 - start;
    let missingArrayCopy = 0;
    for (let index = 0; index < sections.length; index++) {
        let section = sections[index];
        if (section.shift === 0) {
            partitionStableLastBitsInt(asc, array, start, n, section, aux, startAux);
            missingArrayCopy++;
        } else {
            partitionStableGroupBitsInt(asc, array, start, n, section, aux, startAux);
            missingArrayCopy++;
        }
        if (index === sections.length - 1 && missingArrayCopy % 2 === 1) {
            arrayCopy(aux, startAux, array, start, n);
        }
        [array, aux] = [aux, array];
        [start, startAux] = [startAux, start];

    }
}

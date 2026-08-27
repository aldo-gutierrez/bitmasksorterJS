import {
    arrayCopy, calculateSumOffsets,
    getMaskAsArray,
    getSections,
    getSortOptions, handleNullsUndefinedAndNans,
    validateSortRange
} from "../utils/sorter-utils.js";
import {
    partitionReverseStableInt,
    partitionStableInt,
    calculateMaskInt,
} from "../utils/sorter-utils-object-int.js";

export function radixBitSortObjectByInt32Key(array, mapper, options) {
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1, mapper));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let mask = calculateMaskInt(array, start, endP1, mapper);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }
    let aux = Array(endP1 - start);
    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = asc ? partitionReverseStableInt(array, start, endP1, 1 << 31, aux, mapper)
            :partitionStableInt(array, start, endP1, 1 << 31, aux, mapper);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let mask1 = 0;
        let mask2 = 0;
        if (n1 > 1) { //sort negative numbers
            mask1 = calculateMaskInt(array, start, finalLeft, mapper);
            if (mask1 === 0) {
                n1 = 0;
            }
        }
        if (n2 > 1) { //sort positive numbers
            mask2 = calculateMaskInt(array, finalLeft, endP1, mapper);
            if (mask2 === 0) {
                n2 = 0;
            }
        }
        if (n1 > 1) {
            bList = getMaskAsArray(mask1);
            radixSortInt(asc, array, start, finalLeft, bList, aux, mapper);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            radixSortInt(asc, array, finalLeft, endP1, bList, aux, mapper);
        }
    } else {
        radixSortInt(asc, array, start, endP1, bList, aux, mapper);
    }
}

function radixSortInt(asc, array, start, end, bList, aux, mapper) {
    let sections = getSections(bList);
    for (let index = 0; index < sections.length; index++) {
        let section = sections[index];
        let bits = section.bits;
        let shift = section.shift;
        let mask = section.mask
        if (bits === 1) {
            if (asc) {
                partitionStableInt(array, start, end, mask, aux, mapper);
            } else {
                partitionReverseStableInt(array, start, end, mask, aux, mapper);
            }
        } else {
            if (shift === 0) {
                partitionStableLastBitsInt(asc, array, start, end, section, aux, mapper);
            } else {
                partitionStableGroupBitsInt(asc, array, start, end, section, aux, mapper);
            }
        }
    }
}

function partitionStableLastBitsInt(asc, array, start, endP1, section, aux, mapper) {
    const mask = section.mask;
    const range = section.range;
    const count = new Int32Array(range);
    let n = endP1 - start;
    for (let i = start; i < endP1; i++) {
        count[mapper(array[i]) & mask]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        aux[count[element & mask]++] = array[i];
    }
    arrayCopy(aux, 0, array, start, n);
}

function partitionStableGroupBitsInt(asc, array, start, endP1, section, aux, mapper) {
    const mask = section.mask;
    const shift = section.shift;
    const range = section.range;
    const count = new Int32Array(range);
    let n = endP1 - start;
    for (let i = start; i < endP1; i++) {
        count[(mapper(array[i]) & mask) >> shift]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        aux[count[(element & mask) >> shift]++] = array[i];
    }
    arrayCopy(aux, 0, array, start, n);
}



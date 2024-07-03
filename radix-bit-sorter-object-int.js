import {
    arrayCopy,
    getMaskAsArray,
    getMaskRangeBits,
    getSections
} from "./sorter-utils.js";

export function sortObjectInt(array, mapper, start, endP1) {
    if (!start) {
        start = 0;
    }
    if (!endP1) {
        endP1 = array.length;
    }
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
        let finalLeft = partitionReverseStableInt(array, start, endP1, 1 << 31, aux, mapper);
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
            radixSortInt(array, start, finalLeft, bList, aux, mapper);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            radixSortInt(array, finalLeft, endP1, bList, aux, mapper);
        }
    } else {
        radixSortInt(array, start, endP1, bList, aux, mapper);
    }
}

function radixSortInt(array, start, end, bList, aux, mapper) {
    let sections = getSections(bList);
    for (let index = 0; index < sections.length; index++) {
        let res = sections[index];
        let bits = res[0];
        let shift = res[1];
        let bStart = res[2];
        let mask = getMaskRangeBits(bStart, shift);
        if (bits === 1) {
            partitionStableInt(array, start, end, mask, aux, mapper);
        } else {
            let dRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsInt(array, start, end, mask, dRange, aux, mapper);
            } else {
                partitionStableGroupBitsInt(array, start, end, mask, shift, dRange, aux, mapper);
            }
        }
    }
}

function partitionStableInt(array, start, endP1, mask, aux, mapper) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        if ((element & mask) === 0) {
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

function partitionReverseStableInt(array, start, endP1, mask, aux, mapper) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
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

function partitionStableLastBitsInt(array, start, endP1, mask, dRange, aux, mapper) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; i++) {
        count[mapper(array[i]) & mask]++;
    }
    for (let i = 0, sum = 0; i < dRange; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        aux[count[element & mask]++] = array[i];
    }
    arrayCopy(aux, 0, array, start, endP1 - start);
}

function partitionStableGroupBitsInt(array, start, endP1, mask, shiftRight, dRange, aux, mapper) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; i++) {
        count[(mapper(array[i]) & mask) >> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < dRange; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        aux[count[(element & mask) >> shiftRight]++] = array[i];
    }
    arrayCopy(aux, 0, array, start, endP1 - start);
}


function calculateMaskInt(array, start, endP1, mapper) {
    let mask = 0x00000000;
    let inv_mask = 0x00000000;
    for (let i = start; i < endP1; i++) {
        let ei = mapper(array[i]);
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
}
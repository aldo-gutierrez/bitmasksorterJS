import {arrayCopy, getSections} from "./sorter-utils.js";
import {partitionReverseNotStableUpperBit} from "./sorter-utils.js";
import {getMaskAsArray} from "./sorter-utils.js";

function calculateMaskInt(array, start, endP1) {
    let mask = 0x00000000;
    let inv_mask = 0x00000000;
    for (let i = start; i < endP1; i++) {
        let ei = array[i];
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
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

function partitionStableLastBitsInt(array, start, endP1, mask, kRange, aux) {
    let count = Array(kRange).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i] & mask]++;
    }
    for (let i = 0, sum = 0; i < kRange; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[element & mask]++] = element;
    }
    arrayCopy(aux, 0, array, start, endP1 - start);
}

function partitionStableGroupBitsInt(array, start, endP1, mask, shiftRight, kRange, aux) {
    let count = Array(kRange).fill(0);
    for (let i = start; i < endP1; i++) {
        count[(array[i] & mask) >> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < kRange; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[(element & mask) >> shiftRight]++] = element;
    }
    arrayCopy(aux, 0, array, start, endP1 - start);
}

function radixSortInt(array, start, end, bList, aux) {
    let sections = getSections(bList);
    for (let index = 0; index < sections.length; index++) {
        let res = sections[index];
        let mask = res[0];
        let bits = res[1];
        let shift = res[2];
        if (bits === 1) {
            partitionStableInt(array, start, end, mask, aux);
        } else {
            let kRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsInt(array, start, end, mask, kRange, aux);
            } else {
                partitionStableGroupBitsInt(array, start, end, mask, shift, kRange, aux);
            }
        }
    }
}

export function sortInt(array, start, endP1) {
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
    let mask = calculateMaskInt(array, start, endP1);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }
    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseNotStableUpperBit(array, start, endP1);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let bList1;
        let bList2;
        if (n1 > 1) { //sort negative numbers
            bList1 = getMaskAsArray(calculateMaskInt(array, start, finalLeft));
            if (bList1.length <= 0) {
                n1 = 0;
            }
        }
        if (n2 > 1) { //sort positive numbers
            bList2 = getMaskAsArray(calculateMaskInt(array, finalLeft, endP1));
            if (bList2.length <= 0) {
                n2 = 0;
            }
        }
        let aux = Array(Math.max(n1, n2)).fill(0);
        if (n1 > 0) {
            radixSortInt(array, start, finalLeft, bList1, aux);
        }
        if (n2 > 0) {
            radixSortInt(array, finalLeft, endP1, bList2, aux);
        }
    } else {
        let aux = Array(endP1 - start).fill(0);
        radixSortInt(array, start, endP1, bList, aux);
    }
}

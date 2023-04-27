import {arraycopy, getSections} from "./commonSorter.js";
import {partitionReverseNotStableUpperBit} from "./commonSorter.js";
import {getMaskAsArray} from "./commonSorter.js";

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
    arraycopy(aux, 0, array, left, right);
    return left;
}

function partitionStableLastBitsInt(array, start, endP1, mask, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i] & mask]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[element & mask]++] = element;
    }
    arraycopy(aux, 0, array, start, endP1 - start);
}

function partitionStableGroupBitsInt(array, start, endP1, mask, shiftRight, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < endP1; i++) {
        count[(array[i] & mask) >> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[(element & mask) >> shiftRight]++] = element;
    }
    arraycopy(aux, 0, array, start, endP1 - start);
}

function radixSortInt(array, start, end, kList, aux) {
    let sections = getSections(kList);
    for (let index = 0; index < sections.length; index++) {
        let res = sections[index];
        let maskI = res[0];
        let bits = res[1];
        let shift = res[2];
        if (bits === 1) {
            partitionStableInt(array, start, end, maskI, aux);
        } else {
            let twoPowerBits = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsInt(array, start, end, maskI, twoPowerBits, aux);
            } else {
                partitionStableGroupBitsInt(array, start, end, maskI, shift, twoPowerBits, aux);
            }
        }
    }
}

export function sortInt(array, start, endP1) {
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let mask = calculateMaskInt(array, start, endP1);
    let kList = getMaskAsArray(mask);
    if (kList.length === 0) {
        return;
    }
    if (kList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseNotStableUpperBit(array, start, endP1);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let aux = Array(Math.max(n1, n2)).fill(0);
        if (n1 > 1) { //sort negative numbers
            mask = calculateMaskInt(array, start, finalLeft);
            kList = getMaskAsArray(mask);
            radixSortInt(array, start, finalLeft, kList, aux);
        }
        if (n2 > 1) { //sort positive numbers
            mask = calculateMaskInt(array, finalLeft, endP1);
            kList = getMaskAsArray(mask);
            radixSortInt(array, finalLeft, endP1, kList, aux);
        }
    } else {
        let aux = Array(endP1 - start).fill(0);
        radixSortInt(array, start, endP1, kList, aux);
    }
}

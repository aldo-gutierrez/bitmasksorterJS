import {arrayCopy, getSections, getMaskRangeBits} from "./sorter-utils.js";
import {calculateMaskInt, partitionReverseNotStableUpperBit} from "./sorter-utils-int.js";
import {getMaskAsArray} from "./sorter-utils.js";

export function radixBitSorterInt(array, start, endP1) {
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
        let mask1 = 0;
        let mask2 = 0;
        if (n1 > 1) { //sort negative numbers
            mask1 = calculateMaskInt(array, start, finalLeft);
            if (mask1 === 0) {
                n1 = 0;
            }
        }
        if (n2 > 1) { //sort positive numbers
            mask2 = calculateMaskInt(array, finalLeft, endP1);
            if (mask2 === 0) {
                n2 = 0;
            }
        }
        let aux = Array(Math.max(n1, n2));
        if (n1 > 1) {
            bList = getMaskAsArray(mask1);
            radixSortInt(array, start, finalLeft, bList, aux);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            radixSortInt(array, finalLeft, endP1, bList, aux);
        }
    } else {
        let aux = Array(endP1 - start);
        radixSortInt(array, start, endP1, bList, aux);
    }
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

function partitionStableLastBitsInt(array, start, endP1, mask, dRange, aux) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i] & mask]++;
    }
    for (let i = 0, sum = 0; i < dRange; i++) {
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

function partitionStableGroupBitsInt(array, start, endP1, mask, shiftRight, dRange, aux) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; i++) {
        count[(array[i] & mask) >> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < dRange; i++) {
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
        let section = sections[index];
        let bits = section.bits;
        let shift = section.shift;
        let bStart = section.start;
        let mask = section.mask;
        if (bits === 1) {
            partitionStableInt(array, start, end, mask, aux);
        } else {
            let dRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsInt(array, start, end, mask, dRange, aux);
            } else {
                partitionStableGroupBitsInt(array, start, end, mask, shift, dRange, aux);
            }
        }
    }
}

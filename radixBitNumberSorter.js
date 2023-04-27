import {arraycopy, getMaskAsArray, getSections, partitionReverseNotStableUpperBit, reverse} from "./commonSorter.js";

function calculateMaskNumber(array, start, endP1) {
    let pMask0 = 0;
    let invMask0 = 0;
    let pMask1 = 0;
    let invMask1 = 0;
    for (let i = start; i < endP1; ++i) {
        let im2 = i * 2;
        let ei0 = array[im2];
        let ei1 = array[im2 + 1];
        pMask0 = pMask0 | ei0;
        invMask0 = invMask0 | (~ei0);
        pMask1 = pMask1 | ei1;
        invMask1 = invMask1 | (~ei1);
    }
    return [pMask0 & invMask0, pMask1 & invMask1]
}

function getMaskAsArrayNumber(masks) {
    return [getMaskAsArray(masks[0]), getMaskAsArray(masks[1])];
}


function partitionStableNumber(array, start, endP1, mask, elementIndex, aux) {
    let left = start;
    let right = 0;
    let element = [0, 0];
    for (let i = start; i < endP1; i++) {
        element[0] = array[i * 2];
        element[1] = array[i * 2 + 1];
        if ((element[elementIndex] & mask) === 0) {
            array[left * 2] = element[0];
            array[left * 2 + 1] = element[1];
            left++;
        } else {
            aux[right * 2] = element[0];
            aux[right * 2 + 1] = element[1];
            right++;
        }
    }
    arraycopy(aux, 0, array, left * 2, right * 2);
    return left;
}

function partitionStableLastBitsNumber(array, start, endP1, mask, elementIndex, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[array[i * 2 + elementIndex] & mask]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; ++i) {
        let element0 = array[i * 2];
        let element1 = array[i * 2 + 1];
        let elementShiftMasked = array[i * 2 + elementIndex] & mask;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        aux[index * 2] = element0;
        aux[index * 2 + 1] = element1;
    }
    arraycopy(aux, 0, array, start * 2, (endP1 - start) * 2);
}

function partitionStableGroupBitsNumber(array, start, endP1, mask, elementIndex, shiftRight, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[(array[i * 2 + elementIndex] & mask) >>> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; ++i) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; ++i) {
        let element0 = array[i * 2];
        let element1 = array[i * 2 + 1];
        let elementShiftMasked = (array[i * 2 + elementIndex] & mask) >>> shiftRight;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        aux[index * 2] = element0;
        aux[index * 2 + 1] = element1;
    }
    arraycopy(aux, 0, array, start * 2, (endP1 - start) * 2);
}


function radixSortNumber(array, start, end, kList, aux) {
    let elementIndex = 0;
    let sections0 = getSections(kList[elementIndex]);
    for (let index = 0; index < sections0.length; index++) {
        let res = sections0[index];
        let maskI = res[0];
        let bits = res[1];
        let shift = res[2];
        if (bits === 1) {
            partitionStableNumber(array, start, end, maskI, elementIndex, aux);
        } else {
            let twoPowerBits = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsNumber(array, start, end, maskI, elementIndex, twoPowerBits, aux);
            } else {
                partitionStableGroupBitsNumber(array, start, end, maskI, elementIndex, shift, twoPowerBits, aux);
            }
        }
    }
    elementIndex = 1;
    let sections1 = getSections(kList[elementIndex]);
    for (let index = 0; index < sections1.length; index++) {
        let res = sections1[index];
        let maskI = res[0];
        let bits = res[1];
        let shift = res[2];
        if (bits === 1) {
            partitionStableNumber(array, start, end, maskI, elementIndex, aux);
        } else {
            let twoPowerBits = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsNumber(array, start, end, maskI, elementIndex, twoPowerBits, aux);
            } else {
                partitionStableGroupBitsNumber(array, start, end, maskI, elementIndex, shift, twoPowerBits, aux);
            }
        }
    }
}

export function sortNumber(array, start, endP1) {
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let float64Array = new Float64Array(array);
    const buffer = float64Array.buffer
    let arrayInt32 = new Int32Array(buffer); //[0] = lower 32 bits, [1] higher 32 bits

    let mask = calculateMaskNumber(arrayInt32, start, endP1);
    let kList = getMaskAsArrayNumber(mask);
    if (kList[0].length === 0 && kList[1].length === 0) {
        return;
    }
    if (kList[1][0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseNotStableUpperBit(float64Array, start, endP1);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let aux = new Int32Array((Math.max(n1, n2)) * 2);
        if (n1 > 1) { //sort negative numbers
            mask = calculateMaskNumber(arrayInt32, start, finalLeft);
            kList = getMaskAsArrayNumber(mask);
            if (!(kList[0].length === 0 && kList[1].length === 0)) {
                radixSortNumber(arrayInt32, start, finalLeft, kList, aux);
                reverse(float64Array, start, finalLeft);
            }
        }
        if (n2 > 1) { //sort positive numbers
            mask = calculateMaskNumber(arrayInt32, finalLeft, endP1);
            kList = getMaskAsArrayNumber(mask);
            if (!(kList[0].length === 0 && kList[1].length === 0)) {
                radixSortNumber(arrayInt32, finalLeft, endP1, kList, aux);
            }
        }
    } else {
        let aux = new Int32Array((endP1 - start) * 2);
        radixSortNumber(arrayInt32, start, endP1, kList, aux);
        if (float64Array[0] < 0) {
            reverse(float64Array, start, endP1);
        }
    }

    arraycopy(float64Array, 0, array, start, endP1 - start);
}
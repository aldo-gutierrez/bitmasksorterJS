import {
    arrayCopy,
    getMaskAsArray,
    getMaskRangeBits,
    getSections,
    partitionReverseNotStableUpperBit,
    reverse
} from "./sorter-utils.js";

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


function partitionStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = arrayF64[i];
        if ((arrayI32[i * 2 + elementIndex] & mask) === 0) {
            arrayF64[left] = element;
            left++;
        } else {
            auxF64[right] = element;
            right++;
        }
    }
    arrayCopy(auxF64, 0, arrayF64, left, right);
    return left;
}

function partitionStableLastBitsNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, dRange, auxF64) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[arrayI32[i * 2 + elementIndex] & mask]++;
    }
    for (let i = 0, sum = 0; i < dRange; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; ++i) {
        let element = arrayF64[i];
        let elementShiftMasked = arrayI32[i * 2 + elementIndex] & mask;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index] = element;
    }
    arrayCopy(auxF64, 0, arrayF64, start, (endP1 - start));
}

function partitionStableGroupBitsNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, shiftRight, dRange, auxF64) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[(arrayI32[i * 2 + elementIndex] & mask) >>> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < dRange; ++i) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; ++i) {
        let element = arrayF64[i];
        let elementShiftMasked = (arrayI32[i * 2 + elementIndex] & mask) >>> shiftRight;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index] = element;
    }
    arrayCopy(auxF64, 0, arrayF64, start, (endP1 - start));
}


function radixSortNumber(arrayI32, arrayF64, start, endP1, bList, auxF64) {
    let elementIndex = 0;
    let sections0 = getSections(bList[elementIndex]);
    for (let index = 0; index < sections0.length; index++) {
        let res = sections0[index];
        let bits = res[0];
        let shift = res[1];
        let bStart = res[2];
        let mask = getMaskRangeBits(bStart, shift);
        if (bits === 1) {
            partitionStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64);
        } else {
            let dRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, dRange, auxF64);
            } else {
                partitionStableGroupBitsNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, shift, dRange, auxF64);
            }
        }
    }
    elementIndex = 1;
    let sections1 = getSections(bList[elementIndex]);
    for (let index = 0; index < sections1.length; index++) {
        let res = sections1[index];
        let bits = res[0];
        let shift = res[1];
        let bStart = res[2];
        let mask = getMaskRangeBits(bStart, shift);
        if (bits === 1) {
            partitionStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64);
        } else {
            let dRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, dRange, auxF64);
            } else {
                partitionStableGroupBitsNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, shift, dRange, auxF64);
            }
        }
    }
}

export function sortNumber(array, start, endP1) {
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
    let arrayFloat64 = array instanceof  Float64Array ? array : new Float64Array(array);
    const buffer = arrayFloat64.buffer
    let arrayInt32 = new Int32Array(buffer); //[0] = lower 32 bits, [1] higher 32 bits

    let mask = calculateMaskNumber(arrayInt32, start, endP1);
    let bList = getMaskAsArrayNumber(mask);
    if (bList[0].length === 0 && bList[1].length === 0) {
        return;
    }
    if (bList[1][0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseNotStableUpperBit(arrayFloat64, start, endP1);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let bList1;
        let bList2;
        if (n1 > 1) { //sort negative numbers
            bList1 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, start, finalLeft));
            if (bList1[0].length === 0 && bList1[1].length === 0) {
                n1 = 0;
            }
        }
        if (n2 > 1) { //sort positive numbers
            bList2 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, finalLeft, endP1));
            if (bList2[0].length === 0 && bList2[1].length === 0) {
                n2 = 0;
            }
        }
        let auxFloat64= new Float64Array(Math.max(n1, n2));
        if (!(bList1[0].length === 0 && bList1[1].length === 0)) {
            radixSortNumber(arrayInt32, arrayFloat64, start, finalLeft, bList1, auxFloat64);
            reverse(arrayFloat64, start, finalLeft);
        }
        if (!(bList2[0].length === 0 && bList2[1].length === 0)) {
            radixSortNumber(arrayInt32, arrayFloat64, finalLeft, endP1, bList2, auxFloat64);
        }
    } else {
        let auxFloat64= new Float64Array(endP1 - start);
        radixSortNumber(arrayInt32, arrayFloat64, start, endP1, bList, auxFloat64);
        if (arrayFloat64[0] < 0) {
            reverse(arrayFloat64, start, endP1);
        }
    }

    arrayCopy(arrayFloat64, 0, array, start, endP1 - start);
}
import {
    arrayCopy, getMaskRangeBits, getSections,
    partitionReverseNotStableUpperBit,
    reverse
} from "./sorter-utils.js";
import {calculateMaskNumber, getMaskAsArrayNumber} from "./radix-bit-sorter-number.js";

export function sortObjectNumber(arrayObj, mapper, start, endP1) {
    if (!start) {
        start = 0;
    }
    if (!endP1) {
        endP1 = arrayObj.length;
    }
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let arrayFloat64 = new Float64Array(n);
    let j = 0;
    for (let i=start; i < endP1; i++) {
        let elementObj = arrayObj[i];
        if (!((elementObj === null || elementObj === undefined))) {
            let element = mapper(elementObj);
            if (!((element === null || element === undefined))) {
                arrayFloat64[j] = element;
                j++;
            } else {
                //TODO
            }
        } else {
            //TODO
        }
    }
    const buffer = arrayFloat64.buffer
    let arrayInt32 = new Int32Array(buffer); //[0] = lower 32 bits, [1] higher 32 bits

    let mask = calculateMaskNumber(arrayInt32, start, endP1, mapper);
    let bList = getMaskAsArrayNumber(mask);
    if (bList[0].length === 0 && bList[1].length === 0) {
        return;
    }
    let auxFloat64= new Float64Array(endP1 - start);
    let auxObj = Array(endP1 - start).fill(null);

    if (bList[1][0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseStableNumber(arrayInt32, arrayFloat64, arrayObj, start, endP1, 1 << 31, 1, auxFloat64, auxObj);
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
        if (!(bList1[0].length === 0 && bList1[1].length === 0)) {
            radixSortNumber(arrayInt32, arrayFloat64, arrayObj, start, finalLeft, bList1, auxFloat64, auxObj);
            //reverse(arrayFloat64, start, finalLeft);
            reverse(arrayObj, start, finalLeft);
        }
        if (!(bList2[0].length === 0 && bList2[1].length === 0)) {
            radixSortNumber(arrayInt32, arrayFloat64, arrayObj, finalLeft, endP1, bList2, auxFloat64, auxObj);
        }
    } else {
        radixSortNumber(arrayInt32, arrayFloat64, arrayObj, start, endP1, bList, auxFloat64, auxObj);
        if (arrayFloat64[0] < 0) {
            //reverse(arrayFloat64, start, endP1);
            reverse(arrayObj, start, finalLeft);
        }
    }
}

function radixSortNumber(arrayI32, arrayF64, arrayObj, start, endP1, bList, auxF64, auxObj) {
    let elementIndex = 0;
    let sections0 = getSections(bList[elementIndex]);
    for (let index = 0; index < sections0.length; index++) {
        let res = sections0[index];
        let bits = res[0];
        let shift = res[1];
        let bStart = res[2];
        let mask = getMaskRangeBits(bStart, shift);
        if (bits === 1) {
            partitionStableNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, auxF64, auxObj);
        } else {
            let dRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, dRange, auxF64, auxObj);
            } else {
                partitionStableGroupBitsNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, shift, dRange, auxF64, auxObj);
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
            partitionStableNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, auxF64, auxObj);
        } else {
            let dRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, dRange, auxF64, auxObj);
            } else {
                partitionStableGroupBitsNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, shift, dRange, auxF64, auxObj);
            }
        }
    }
}

function partitionReverseStableNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, auxF64, auxObj) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = arrayF64[i];
        let elementObj = arrayObj[i];
        if (!((arrayI32[i * 2 + elementIndex] & mask) === 0)) {
            arrayF64[left] = element;
            arrayObj[left] = elementObj;
            left++;
        } else {
            auxF64[right] = element;
            auxObj[right] = elementObj;
            right++;
        }
    }
    arrayCopy(auxF64, 0, arrayF64, left, right);
    arrayCopy(auxObj, 0, arrayObj, left, right);
    return left;
}

function partitionStableNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, auxF64, auxObj) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = arrayF64[i];
        let elementObj = arrayObj[i];
        if ((arrayI32[i * 2 + elementIndex] & mask) === 0) {
            arrayF64[left] = element;
            arrayObj[left] = elementObj;
            left++;
        } else {
            auxF64[right] = element;
            auxObj[right] = elementObj;
            right++;
        }
    }
    arrayCopy(auxF64, 0, arrayF64, left, right);
    arrayCopy(auxObj, 0, arrayObj, left, right);
    return left;
}

function partitionStableLastBitsNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, dRange, auxF64, auxObj) {
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
        let elementObj = arrayObj[i];
        let elementShiftMasked = arrayI32[i * 2 + elementIndex] & mask;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index] = element;
        auxObj[index] = elementObj;
    }
    arrayCopy(auxF64, 0, arrayF64, start, (endP1 - start));
    arrayCopy(auxObj, 0, arrayObj, start, (endP1 - start));
}

function partitionStableGroupBitsNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, shiftRight, dRange, auxF64, auxObj) {
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
        let elementObj = arrayObj[i];
        let elementShiftMasked = (arrayI32[i * 2 + elementIndex] & mask) >>> shiftRight;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index] = element;
        auxObj[index] = elementObj;
    }
    arrayCopy(auxF64, 0, arrayF64, start, (endP1 - start));
    arrayCopy(auxObj, 0, arrayObj, start, (endP1 - start));
}


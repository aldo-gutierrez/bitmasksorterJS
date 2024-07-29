import {
    arrayCopy, getMaskAsArray, getSections,
} from "./sorter-utils.js";
import {calculateMaskInt} from "./sorter-utils-int.js";

export function radixBitSorterObjectIntV2(arrayObj, mapper, start, endP1) {
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
    let j = 0;
    let nulls = 0;
    let undefinedValues = 0;
    let nans = [];
    let arrayInt32 = new Int32Array(n);
    for (let i = start; i < endP1; i++) {
        let elementObj = arrayObj[i];
        if (elementObj === null) {
            nulls++;
            continue;
        }
        if (elementObj === undefined) {
            undefinedValues++;
            continue;
        }
        let element = mapper(elementObj);
        if (isNaN(element)) {
            nans.push(element);
            continue;
        }
        if (i !== j) {
            arrayObj[j] = element;
        }
        arrayInt32[j] = element;
        j++;
    }
    arrayCopy(nans, 0, arrayObj, j, nans.length);
    j += nans.length;
    while (nulls > 0) {
        arrayObj[j] = null;
        nulls--;
        j++;
    }
    while (undefinedValues > 0) {
        arrayObj[j] = undefined;
        undefinedValues--;
        j++;
    }
    endP1 = endP1 - nans.length - nulls - undefinedValues;
    n = endP1 - start;

    let mask = calculateMaskInt(arrayInt32, start, endP1);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }

    let auxInt32 = new Int32Array(endP1 - start);
    let auxObj = Array(endP1 - start).fill(null);

    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseStableObjectI32(arrayInt32, arrayObj, start, endP1, 1 << 31, auxInt32, auxObj);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) { //sort negative numbers
            let bList1 = getMaskAsArray(calculateMaskInt(arrayInt32, start, finalLeft));
            if (!(bList1.length === 0)) {
                radixSortObjectI32(true, arrayInt32, arrayObj, start, finalLeft, bList1, auxInt32, auxObj);
            }
        }
        if (n2 > 1) { //sort positive numbers
            let bList2 = getMaskAsArray(calculateMaskInt(arrayInt32, finalLeft, endP1));
            if (!(bList2.length === 0)) {
                radixSortObjectI32(true, arrayInt32, arrayObj, finalLeft, endP1, bList2, auxInt32, auxObj);
            }
        }
    } else {
        radixSortObjectI32(true, arrayInt32, arrayObj, start, endP1, bList, auxInt32, auxObj);
    }
}

function radixSortObjectI32(asc, arrayI32, arrayObj, start, endP1, bList, auxI32, auxObj) {
    let sections0 = getSections(bList);
    for (let index = 0; index < sections0.length; index++) {
        let section = sections0[index];
        let bits = section.bits;
        let shift = section.shift;
        let bStart = section.start;
        let mask = section.mask;
        if (bits === 1) {
            if (asc) {
                partitionStableObjectI32(arrayI32, arrayObj, start, endP1, mask, auxI32, auxObj);
            } else {
                partitionReverseStableObjectI32(arrayI32, arrayObj, start, endP1, mask, auxI32, auxObj);
            }
        } else {
            let dRange = 1 << bits;
            if (shift === 0) {
                partitionStableLastBitsObjectI32(asc, arrayI32, arrayObj, start, endP1, mask, dRange, auxI32, auxObj);
            } else {
                partitionStableGroupBitsObjectI32(asc, arrayI32, arrayObj, start, endP1, mask, shift, dRange, auxI32, auxObj);
            }
        }
    }
}

function partitionReverseStableObjectI32(arrayI32, arrayObj, start, endP1, mask, auxI32, auxObj) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = arrayI32[i];
        let elementObj = arrayObj[i];
        if (!((arrayI32[i] & mask) === 0)) {
            arrayI32[left] = element;
            arrayObj[left] = elementObj;
            left++;
        } else {
            auxI32[right] = element;
            auxObj[right] = elementObj;
            right++;
        }
    }
    arrayCopy(auxI32, 0, arrayI32, left, right);
    arrayCopy(auxObj, 0, arrayObj, left, right);
    return left;
}

function partitionStableObjectI32(arrayI32, arrayObj, start, endP1, mask, auxI32, auxObj) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = arrayI32[i];
        let elementObj = arrayObj[i];
        if ((arrayI32[i] & mask) === 0) {
            arrayI32[left] = element;
            arrayObj[left] = elementObj;
            left++;
        } else {
            auxI32[right] = element;
            auxObj[right] = elementObj;
            right++;
        }
    }
    arrayCopy(auxI32, 0, arrayI32, left, right);
    arrayCopy(auxObj, 0, arrayObj, left, right);
    return left;
}

function partitionStableLastBitsObjectI32(asc, arrayI32, arrayObj, start, endP1, mask, dRange, auxI32, auxObj) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[arrayI32[i] & mask]++;
    }
    if (asc) {
        for (let i = 0, sum = 0; i < dRange; ++i) {
            let c = count[i];
            count[i] = sum;
            sum += c;
        }
    } else {
        for (let i = dRange - 1, sum = 0; i >= 0; --i) {
            let c = count[i];
            count[i] = sum;
            sum += c;
        }
    }
    for (let i = start; i < endP1; ++i) {
        let element = arrayI32[i];
        let elementObj = arrayObj[i];
        let elementShiftMasked = arrayI32[i] & mask;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxI32[index] = element;
        auxObj[index] = elementObj;
    }
    arrayCopy(auxI32, 0, arrayI32, start, (endP1 - start));
    arrayCopy(auxObj, 0, arrayObj, start, (endP1 - start));
}

function partitionStableGroupBitsObjectI32(asc, arrayI32, arrayObj, start, endP1, mask, shiftRight, dRange, auxI32, auxObj) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[(arrayI32[i] & mask) >>> shiftRight]++;
    }
    if (asc) {
        for (let i = 0, sum = 0; i < dRange; ++i) {
            let c = count[i];
            count[i] = sum;
            sum += c;
        }
    } else {
        for (let i = dRange - 1, sum = 0; i >= 0; --i) {
            let c = count[i];
            count[i] = sum;
            sum += c;
        }
    }
    for (let i = start; i < endP1; ++i) {
        let element = arrayI32[i];
        let elementObj = arrayObj[i];
        let elementShiftMasked = (arrayI32[i] & mask) >>> shiftRight;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxI32[index] = element;
        auxObj[index] = elementObj;
    }
    arrayCopy(auxI32, 0, arrayI32, start, (endP1 - start));
    arrayCopy(auxObj, 0, arrayObj, start, (endP1 - start));
}


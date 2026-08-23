import {
    arrayCopy, arrayCopyTypedArray, calculateSumOffsets, getMaskAsArray, getSections,
    validateSortRange,
} from "./sorter-utils.js";
import { calculateMaskInt } from "./sorter-utils-int.js";

export function radixBitSorterObjectIntV2(arrayObj, mapper, start, endP1) {
    ({ start, endP1 } = validateSortRange(arrayObj, start, endP1));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let j = 0; //iterator of arrayInt32
    let nulls = 0;
    let undefinedValues = 0;
    let nans = [];
    let arrayInt32 = new Int32Array(n);
    //i iterator of arrayObj
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
            nans.push(elementObj);
            continue;
        }
        if (i !== start + j) {
            arrayObj[start + j] = elementObj;
        }
        arrayInt32[j] = element;
        j++;
    }
    arrayCopy(nans, 0, arrayObj, j, nans.length);
    endP1 = endP1 - nans.length - nulls - undefinedValues;
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
    n = endP1 - start;

    let mask = calculateMaskInt(arrayInt32, 0, n);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }

    let auxInt32 = new Int32Array(n);
    let auxObj = Array(n).fill(null);

    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseStableObjectI32(arrayInt32, arrayObj, start, endP1, 1 << 31, auxInt32, auxObj);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) { //sort negative numbers
            let bList1 = getMaskAsArray(calculateMaskInt(arrayInt32, start, finalLeft));
            if (!(bList1.length === 0)) {
                radixSortObjectI32(true, arrayObj, start, n1, bList1, arrayInt32, 0, auxInt32, auxObj, 0);
            }
        }
        if (n2 > 1) { //sort positive numbers
            let bList2 = getMaskAsArray(calculateMaskInt(arrayInt32, finalLeft, endP1));
            if (!(bList2.length === 0)) {
                radixSortObjectI32(true, arrayObj, finalLeft, n2, bList2, arrayInt32, n1, auxInt32, auxObj, 0);
            }
        }
    } else {
        radixSortObjectI32(true, arrayObj, start, n, bList, arrayInt32, 0, auxInt32, auxObj, 0);
    }
}

function radixSortObjectI32(asc, arrayObj, oStart, n, bList, arrayI32, aStart, auxI32, auxObj, auxStart) {
    let sections0 = getSections(bList);
    for (let index = 0; index < sections0.length; index++) {
        let section = sections0[index];
        let bits = section.bits;
        let shift = section.shift;
        let mask = section.mask;
        if (bits === 1) {
            if (asc) {
                partitionStableObjectI32(arrayI32, arrayObj, oStart, oStart + n, mask, auxI32, auxObj);
            } else {
                partitionReverseStableObjectI32(arrayI32, arrayObj, oStart, oStart + n, mask, auxI32, auxObj);
            }
        } else {
            if (shift === 0) {
                partitionStableLastBitsObjectI32(asc, arrayObj, oStart, n, section, arrayI32, aStart, auxI32, auxObj, auxStart);
            } else {
                partitionStableGroupBitsObjectI32(asc, arrayObj, oStart, n, section, arrayI32, aStart, auxI32, auxObj, auxStart);
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
    arrayCopyTypedArray(auxI32, 0, arrayI32, left, right);
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
    arrayCopyTypedArray(auxI32, 0, arrayI32, left, right);
    arrayCopy(auxObj, 0, arrayObj, left, right);
    return left;
}

function partitionStableLastBitsObjectI32(asc, arrayObj, oStart, n, section, arrayI32, aStart, auxI32, auxObj, auxStart) {
    const mask = section.mask;
    const range = section.range;

    const count = new Int32Array(range);
    for (let i = 0; i < n; ++i) {
        count[arrayI32[i + aStart] & mask]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = 0; i < n; ++i) {
        let element = arrayI32[i + aStart];
        let elementObj = arrayObj[i + oStart];
        let elementShiftMasked = element & mask;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        const indexAux = index + auxStart;
        auxI32[indexAux] = element;
        auxObj[indexAux] = elementObj;
    }
    arrayCopyTypedArray(auxI32, auxStart, arrayI32, aStart, n);
    arrayCopy(auxObj, auxStart, arrayObj, oStart, n);
}

function partitionStableGroupBitsObjectI32(asc, arrayObj, oStart, n, section, arrayI32, aStart, auxI32, auxObj, auxStart) {
    const mask = section.mask;
    const range = section.range;
    const shift = section.shift;

    const count = new Int32Array(range);
    for (let i = 0; i < n; ++i) {
        count[(arrayI32[i + aStart] & mask) >>> shift]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = 0; i < n; ++i) {
        let element = arrayI32[i + aStart];
        let elementObj = arrayObj[i + oStart];
        let elementShiftMasked = (element & mask) >>> shift;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        const indexAux = index + auxStart;
        auxI32[indexAux] = element;
        auxObj[indexAux] = elementObj;
    }
    arrayCopyTypedArray(auxI32, auxStart, arrayI32, aStart, n);
    arrayCopy(auxObj, auxStart, arrayObj, oStart, n);
}

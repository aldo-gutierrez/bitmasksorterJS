import {
    arrayCopy, arrayCopyTypedArray, calculateSumOffsets, getMaskAsArray, getSections,
    getSortOptions, handleNullsUndefinedAndNans,
    validateSortRange,
} from "../utils/sorter-utils.js";
import { calculateMaskInt } from "../utils/sorter-utils-int.js";

export function radixBitV2SortObjectByInt32Key(arrayObj, mapper, options) {
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(arrayObj, start, endP1));
    let arrayNative;
    ({start, endP1, arrayNative} = handleNullsUndefinedAndNans(arrayObj, nulls, start, endP1, mapper, (n) => new Int32Array(n)));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let arrayInt32 = arrayNative;

    let mask = calculateMaskInt(arrayInt32, 0, n);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }

    let auxInt32 = new Int32Array(n);
    let auxObj = Array(n);

    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = asc ? partitionReverseStableObjectI32(arrayInt32, arrayObj, start, endP1, 1 << 31, auxInt32, auxObj)
            : partitionStableObjectI32(arrayInt32, arrayObj, start, endP1, 1 << 31, auxInt32, auxObj);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) { //sort negative numbers
            let bList1 = getMaskAsArray(calculateMaskInt(arrayInt32, start, finalLeft));
            if (!(bList1.length === 0)) {
                radixSortObjectI32(asc, arrayObj, start, n1, bList1, arrayInt32, 0, auxInt32, auxObj, 0);
            }
        }
        if (n2 > 1) { //sort positive numbers
            let bList2 = getMaskAsArray(calculateMaskInt(arrayInt32, finalLeft, endP1));
            if (!(bList2.length === 0)) {
                radixSortObjectI32(asc, arrayObj, finalLeft, n2, bList2, arrayInt32, n1, auxInt32, auxObj, 0);
            }
        }
    } else {
        radixSortObjectI32(asc, arrayObj, start, n, bList, arrayInt32, 0, auxInt32, auxObj, 0);
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

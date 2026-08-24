import {
    arrayCopy, arrayCopyTypedArray, calculateSumOffsets, getMaskAsArray, getSections,
    getSortOptions,
    validateSortRange,
} from "./sorter-utils.js";
import { calculateMaskNumber, getMaskAsArrayNumber } from "./sorter-utils-number.js";

export function radixBitSorterObjectNumber(arrayObj, mapper, options) {
    let { start, endP1, asc } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(arrayObj, start, endP1));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let j = 0;
    let nulls = 0;
    let undefinedValues = 0;
    let nans = [];
    let arrayFloat64 = new Float64Array(n);
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
        arrayFloat64[j] = element;
        j++;
    }
    endP1 = endP1 - nans.length - nulls - undefinedValues;
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
    n = endP1 - start;
    const buffer = arrayFloat64.buffer
    let arrayInt32 = new Int32Array(buffer); //[0] = lower 32 bits, [1] higher 32 bits

    let mask = calculateMaskNumber(arrayInt32, start, endP1);
    let bList = getMaskAsArrayNumber(mask);
    if (bList[0].length === 0 && bList[1].length === 0) {
        return;
    }
    let auxFloat64 = new Float64Array(endP1 - start);
    let auxObj = Array(endP1 - start).fill(null);

    if (bList[1].length > 0 && bList[1][0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = asc ? partitionReverseStableNumber(arrayInt32, arrayFloat64, arrayObj, start, endP1, 1 << 31, 1, auxFloat64, auxObj)
            : partitionStableNumber(arrayInt32, arrayFloat64, arrayObj, start, endP1, 1 << 31, 1, auxFloat64, auxObj);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) {
            let bList1 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, start, finalLeft));
            if (!(bList1[0].length === 0 && bList1[1].length === 0)) {
                radixSortNumber(false, arrayObj, start, n1, arrayInt32, arrayFloat64, 0, bList1, auxFloat64, auxObj, 0);
            }
        }
        if (n2 > 1) {
            let bList2 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, finalLeft, endP1));
            if (!(bList2[0].length === 0 && bList2[1].length === 0)) {
                radixSortNumber(true, arrayObj, finalLeft, n2, arrayInt32, arrayFloat64, n1, bList2, auxFloat64, auxObj, 0);
            }
        }
    } else {
        if ((arrayInt32[1] & (1 << 31)) !== 0) { //for special case -0
            radixSortNumber(!asc, arrayObj, start, n, arrayInt32, arrayFloat64, 0, bList, auxFloat64, auxObj, 0);
        } else {
            radixSortNumber(asc, arrayObj, start, n, arrayInt32, arrayFloat64, 0, bList, auxFloat64, auxObj, 0);
        }
    }
}

function radixSortNumber(asc, arrayObj, oStart, n, arrayI32, arrayF64, aStart, bList, auxF64, auxObj, auxStart) {
    for (let elementIndex = 0; elementIndex <= 1; elementIndex++) {
        let sections = getSections(bList[elementIndex]);
        for (let index = 0; index < sections.length; index++) {
            let section = sections[index];
            if (section.bits === 1) {
                if (asc) {
                    partitionStableNumber(arrayI32, arrayF64, arrayObj, aStart, aStart + n, section.mask, elementIndex, auxF64, auxObj);
                } else {
                    partitionReverseStableNumber(arrayI32, arrayF64, arrayObj, aStart, aStart + n, section.mask, elementIndex, auxF64, auxObj);
                }
            } else {
                if (section.shift === 0) {
                    partitionStableLastBitsNumber(asc, arrayObj, oStart, n, section, arrayI32, arrayF64, elementIndex, aStart, auxF64, auxObj, auxStart);
                } else {
                    partitionStableGroupBitsNumber(asc, arrayObj, oStart, n, section, arrayI32, arrayF64, elementIndex, aStart, auxF64, auxObj, auxStart);
                }
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
    arrayCopyTypedArray(auxF64, 0, arrayF64, left, right);
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
    arrayCopyTypedArray(auxF64, 0, arrayF64, left, right);
    arrayCopy(auxObj, 0, arrayObj, left, right);
    return left;
}

function partitionStableLastBitsNumber(asc, arrayObj, oStart, n, section, arrayI32, arrayF64, elementIndex, aStart, auxF64, auxObj, auxStart) {
    const mask = section.mask;
    const range = section.range;

    const count = new Int32Array(range);
    for (let i = 0; i < n; ++i) {
        count[arrayI32[(i + aStart) * 2 + elementIndex] & mask]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = 0; i < n; ++i) {
        let element = arrayF64[i + aStart];
        let elementObj = arrayObj[i + oStart];
        let elementShiftMasked = arrayI32[(i + aStart) * 2 + elementIndex] & mask;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        const auxIndex = index + auxStart;
        auxF64[auxIndex] = element;
        auxObj[auxIndex] = elementObj;
    }
    arrayCopyTypedArray(auxF64, auxStart, arrayF64, aStart, n);
    arrayCopy(auxObj, auxStart, arrayObj, oStart, n);
}

function partitionStableGroupBitsNumber(asc, arrayObj, oStart, n, section, arrayI32, arrayF64, elementIndex, aStart, auxF64, auxObj, auxStart) {
    const mask = section.mask;
    const range = section.range;
    const shift = section.shift;

    const count = new Int32Array(range);
    for (let i = 0; i < n; ++i) {
        count[(arrayI32[(i + aStart) * 2 + elementIndex] & mask) >>> shift]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = 0; i < n; ++i) {
        let element = arrayF64[i + aStart];
        let elementObj = arrayObj[i + oStart];
        let elementShiftMasked = (arrayI32[(i + aStart) * 2 + elementIndex] & mask) >>> shift;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        const auxIndex = index + auxStart;
        auxF64[auxIndex] = element;
        auxObj[auxIndex] = elementObj;
    }
    arrayCopyTypedArray(auxF64, auxStart, arrayF64, aStart, n);
    arrayCopy(auxObj, auxStart, arrayObj, oStart, n);
}


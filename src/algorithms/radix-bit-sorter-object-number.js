import {
    arrayCopy,
    arrayCopyTypedArray,
    calculateSumOffsets,
    getSections,
    getSortOptions,
    handleNullsUndefinedAndNans, MAX_BITS_RADIX_SORT,
    validateSortRange,
} from "../utils/sorter-utils.js";
import {calculateMaskNumber, getMaskAsArrayNumber} from "../utils/sorter-utils-number.js";

export function radixBitSortObjectByFloat64Key(arrayObj, mapper, options = {}) {
    options.runtime = options.runtime || {};
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(arrayObj, start, endP1));
    let arrayNative;
    try {
        ({
            start,
            endP1,
            arrayNative
        } = handleNullsUndefinedAndNans(arrayObj, nulls, start, endP1, mapper, (n) => new Float64Array(n)));
    } catch (e) {
        throw new Error("Error in handleNullsUndefinedAndNans: " + e.message);
    }
    const n = endP1 - start;
    if (n < 2) {
        return;
    }
    const arrayFloat64 = arrayNative;
    const arrayInt32 = new Int32Array(arrayFloat64.buffer, arrayFloat64.byteOffset, arrayFloat64.length * 2); //[0] = lower 32 bits, [1] higher 32 bits

    // The compact numeric buffer starts at zero even when the object range does not.
    const mask = options.runtime.mask ?? calculateMaskNumber(arrayInt32, 0, n);
    const bList = getMaskAsArrayNumber(mask);
    if (bList[0].length === 0 && bList[1].length === 0) {
        return;
    }
    const auxFloat64 = new Float64Array(endP1 - start);
    const auxObj = arrayObj.slice(start, endP1);

    if (bList[1].length > 0 && bList[1][0] === 31) { //there are negative numbers and positive numbers
        const finalLeft = asc ? partitionReverseStableNumber(arrayInt32, arrayFloat64, arrayObj, start, n, 1 << 31, 1, auxFloat64, auxObj)
            : partitionStableNumber(arrayInt32, arrayFloat64, arrayObj, start, n, 1 << 31, 1, auxFloat64, auxObj);
        const n1 = finalLeft;
        const n2 = n - finalLeft;
        if (n1 > 1) {
            const bList1 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, 0, finalLeft));
            if (!(bList1[0].length === 0 && bList1[1].length === 0)) {
                radixSortNumber(false, arrayObj, start, n1, arrayFloat64, 0, bList1, auxFloat64, auxObj, 0);
            }
        }
        if (n2 > 1) {
            const bList2 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, finalLeft, n));
            if (!(bList2[0].length === 0 && bList2[1].length === 0)) {
                radixSortNumber(true, arrayObj, start + finalLeft, n2, arrayFloat64, n1, bList2, auxFloat64, auxObj, 0);
            }
        }
    } else {
        if ((arrayInt32[1] & (1 << 31)) !== 0) { //for special case -0
            radixSortNumber(!asc, arrayObj, start, n, arrayFloat64, 0, bList, auxFloat64, auxObj, 0);
        } else {
            radixSortNumber(asc, arrayObj, start, n, arrayFloat64, 0, bList, auxFloat64, auxObj, 0);
        }
    }
}

function radixSortNumber(asc, arrayObj, oStart, n, arrayF64, aStart, bList, auxF64, auxObj, auxObjStart) {
    let needsArrayCopy = 0;
    let auxF64Start = auxObjStart

    for (let elementIndex = 0; elementIndex <= 1; elementIndex++) {
        const log2EffectiveRange = bList[elementIndex][0] - bList[elementIndex][bList.length - 1] + 1;
        const sections = getSections(bList[elementIndex], n > Math.ceil(log2EffectiveRange / MAX_BITS_RADIX_SORT) * 1500 ? MAX_BITS_RADIX_SORT : 8);
        for (let index = 0; index < sections.length; index++) {
            const section = sections[index];
            if (section.shift === 0) {
                partitionStableLastBitsNumber(asc, arrayObj, oStart, n, section, arrayF64, elementIndex, aStart, auxF64, auxF64Start, auxObj, auxObjStart);
                needsArrayCopy++;
            } else {
                partitionStableGroupBitsNumber(asc, arrayObj, oStart, n, section, arrayF64, elementIndex, aStart, auxF64, auxF64Start, auxObj, auxObjStart);
                needsArrayCopy++;
            }
            if (index === sections.length - 1 && needsArrayCopy % 2 === 1) {
                arrayCopyTypedArray(auxF64, auxF64Start, arrayF64, aStart, n);
                arrayCopy(auxObj, auxObjStart, arrayObj, oStart, n);
            }
            [arrayObj, auxObj] = [auxObj, arrayObj];
            [oStart, auxObjStart] = [auxObjStart, oStart];
            [arrayF64, auxF64] = [auxF64, arrayF64];
            [aStart, auxF64Start] = [auxF64Start, aStart];
        }
    }
}

function partitionReverseStableNumber(arrayI32, arrayF64, arrayObj, oStart, n, mask, elementIndex, auxF64, auxObj) {
    let left = 0;
    let right = 0;
    for (let i = 0; i < n; i++) {
        const element = arrayF64[i];
        const elementObj = arrayObj[oStart + i];
        if (!((arrayI32[i * 2 + elementIndex] & mask) === 0)) {
            arrayF64[left] = element;
            arrayObj[oStart + left] = elementObj;
            left++;
        } else {
            auxF64[right] = element;
            auxObj[right] = elementObj;
            right++;
        }
    }
    arrayCopyTypedArray(auxF64, 0, arrayF64, left, right);
    arrayCopy(auxObj, 0, arrayObj, oStart + left, right);
    return left;
}

function partitionStableNumber(arrayI32, arrayF64, arrayObj, oStart, n, mask, elementIndex, auxF64, auxObj) {
    let left = 0;
    let right = 0;
    for (let i = 0; i < n; i++) {
        const element = arrayF64[i];
        const elementObj = arrayObj[oStart + i];
        if ((arrayI32[i * 2 + elementIndex] & mask) === 0) {
            arrayF64[left] = element;
            arrayObj[oStart + left] = elementObj;
            left++;
        } else {
            auxF64[right] = element;
            auxObj[right] = elementObj;
            right++;
        }
    }
    arrayCopyTypedArray(auxF64, 0, arrayF64, left, right);
    arrayCopy(auxObj, 0, arrayObj, oStart + left, right);
    return left;
}

function partitionStableLastBitsNumber(asc, arrayObj, oStart, n, section, arrayF64, elementIndex, aStart, auxF64, auxF64Start, auxObj, auxStart) {
    const arrayI32 = new Int32Array(arrayF64.buffer, arrayF64.byteOffset, arrayF64.length * 2); //[0] = lower 32 bits, [1] higher 32 bits

    const mask = section.mask;
    const range = section.range;

    const count = new Int32Array(range);
    for (let i = 0; i < n; ++i) {
        count[arrayI32[(i + aStart) * 2 + elementIndex] & mask]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = 0; i < n; ++i) {
        const element = arrayF64[i + aStart];
        const elementObj = arrayObj[i + oStart];
        const elementShiftMasked = arrayI32[(i + aStart) * 2 + elementIndex] & mask;
        const index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index + auxF64Start] = element;
        auxObj[index + auxStart] = elementObj;
    }
}

function partitionStableGroupBitsNumber(asc, arrayObj, oStart, n, section, arrayF64, elementIndex, aStart, auxF64, auxF64Start, auxObj, auxStart) {
    const arrayI32 = new Int32Array(arrayF64.buffer, arrayF64.byteOffset, arrayF64.length * 2); //[0] = lower 32 bits, [1] higher 32 bits

    const mask = section.mask;
    const range = section.range;
    const shift = section.shift;

    const count = new Int32Array(range);
    for (let i = 0; i < n; ++i) {
        count[(arrayI32[(i + aStart) * 2 + elementIndex] & mask) >>> shift]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = 0; i < n; ++i) {
        const element = arrayF64[i + aStart];
        const elementObj = arrayObj[i + oStart];
        const elementShiftMasked = (arrayI32[(i + aStart) * 2 + elementIndex] & mask) >>> shift;
        const index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index + auxF64Start] = element;
        auxObj[index + auxStart] = elementObj;
    }
}

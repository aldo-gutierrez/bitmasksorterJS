import {
    arrayCopy, arrayCopyTypedArray, calculateSumOffsets,
    getSections,
    getSortOptions, handleNullsUndefinedAndNans, MAX_BITS_RADIX_SORT,
    reverse,
    validateSortRange
} from "../utils/sorter-utils.js";
import {
    calculateMaskNumber,
    getMaskAsArrayNumber, partitionF64NotStableUpperBit,
    partitionReverseF64NotStableUpperBit
} from "../utils/sorter-utils-number.js";

export function radixBitSortFloat64(array, options = {}) {
    options.runtime = options.runtime || {};
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1));
    const n = endP1 - start;
    if (n < 2) {
        return;
    }
    const isFloat64Array = array instanceof Float64Array;
    const isBigIntArray = array instanceof BigInt64Array;
    const isBigUint64Array = array instanceof BigUint64Array;
    const is64BitInt = isBigIntArray || isBigUint64Array;
    const arrayWas6Bit4Array = isFloat64Array || is64BitInt;
    const originalStart = start;
    let arrayFloat64;
    if (arrayWas6Bit4Array) {
        arrayFloat64 = array;
    } else {
        arrayFloat64 = new Float64Array(n);
        arrayCopy(array, start, arrayFloat64, 0, n);
        start = 0;
        endP1 = n;
    }
    const arrayInt32 = new Int32Array(arrayFloat64.buffer, arrayFloat64.byteOffset, arrayFloat64.length * 2); //[0] = lower 32 bits, [1] higher 32 bits

    const mask = options.runtime.mask ?? calculateMaskNumber(arrayInt32, start, endP1);
    const bList = getMaskAsArrayNumber(mask);
    if (bList[0].length === 0 && bList[1].length === 0) {
        return;
    }
    if (!isBigUint64Array && bList[1][0] === 31) { //there are negative numbers and positive numbers
        const finalLeft = asc ? partitionReverseF64NotStableUpperBit(arrayFloat64, arrayInt32, start, endP1) :
            partitionF64NotStableUpperBit(arrayFloat64, arrayInt32, start, endP1);
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
        const auxFloat64 = arrayWas6Bit4Array ? new array.constructor(Math.max(n1, n2)) : new Float64Array(Math.max(n1, n2));
        if (n1 > 1) {
            const order = is64BitInt ? asc : false;
            radixSortNumber(order, arrayFloat64, start, finalLeft, bList1, auxFloat64);
        }
        if (n2 > 1) {
            const order = is64BitInt ? asc : true;
            radixSortNumber(order, arrayFloat64, finalLeft, endP1, bList2, auxFloat64);
        }
    } else {
        const auxFloat64 = arrayWas6Bit4Array ? new array.constructor(endP1 - start) : new Float64Array(endP1 - start);
        radixSortNumber(asc, arrayFloat64, start, endP1, bList, auxFloat64);
        if (!is64BitInt && (arrayInt32[start * 2 + 1] & (1 << 31)) !== 0) { //for special case -0
             reverse(arrayFloat64, start, endP1);
        }
    }

    if (!arrayWas6Bit4Array) {
        arrayCopy(arrayFloat64, start, array, originalStart, n);
    }
}

function _partitionReverseStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        const element = arrayF64[i];
        if (!((arrayI32[i * 2 + elementIndex] & mask) === 0)) {
            arrayF64[left] = element;
            left++;
        } else {
            auxF64[right] = element;
            right++;
        }
    }
    arrayCopyTypedArray(auxF64, 0, arrayF64, left, right);
    return left;
}

function _partitionStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        const element = arrayF64[i];
        if ((arrayI32[i * 2 + elementIndex] & mask) === 0) {
            arrayF64[left] = element;
            left++;
        } else {
            auxF64[right] = element;
            right++;
        }
    }
    arrayCopyTypedArray(auxF64, 0, arrayF64, left, right);
    return left;
}

function partitionStableLastBitsNumber(asc, arrayF64, start, n, elementIndex, section, auxF64, auxStart) {
    const arrayI32 = new Int32Array(arrayF64.buffer, arrayF64.byteOffset, arrayF64.length * 2);
    const mask = section.mask;
    const range = section.range;
    const count = new Int32Array(range);
    const endP1 = start + n;
    for (let i = start; i < endP1; ++i) {
        count[arrayI32[i * 2 + elementIndex] & mask]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; ++i) {
        const element = arrayF64[i];
        const elementShiftMasked = arrayI32[i * 2 + elementIndex] & mask;
        const index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index + auxStart] = element;
    }
}

function partitionStableGroupBitsNumber(asc, arrayF64, start, n, elementIndex, section, auxF64, auxStart) {
    const arrayI32 = new Int32Array(arrayF64.buffer, arrayF64.byteOffset, arrayF64.length * 2);
    const mask = section.mask;
    const shift = section.shift;
    const range = section.range;
    const count = new Int32Array(range);
    const endP1 = start + n;
    for (let i = start; i < endP1; ++i) {
        count[(arrayI32[i * 2 + elementIndex] & mask) >>> shift]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; ++i) {
        const element = arrayF64[i];
        const elementShiftMasked = (arrayI32[i * 2 + elementIndex] & mask) >>> shift;
        const index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index + auxStart] = element;
    }
    arrayCopyTypedArray(auxF64, 0, arrayF64, start, (endP1 - start));
}


function radixSortNumber(asc, arrayF64, start, endP1, bList, auxF64) {
    const n = endP1 - start;
    let auxStart = 0;
    let needsArrayCopy = 0;
    for (let elementIndex = 0; elementIndex <= 1; elementIndex++) {
        const log2EffectiveRange = bList[elementIndex][0] - bList[elementIndex][bList.length - 1] + 1;
        const sections = getSections(bList[elementIndex], n > Math.ceil(log2EffectiveRange / MAX_BITS_RADIX_SORT) * 1500 ? MAX_BITS_RADIX_SORT : 8);
        for (let index = 0; index < sections.length; index++) {
            const section = sections[index];
            const  shift = section.shift;
            if (shift === 0) {
                partitionStableLastBitsNumber(asc, arrayF64, start, n, elementIndex, section, auxF64, auxStart);
                needsArrayCopy++;
            } else {
                partitionStableGroupBitsNumber(asc, arrayF64, start, n, elementIndex, section, auxF64, auxStart);
                needsArrayCopy++
            }
            if (index === sections.length - 1 && needsArrayCopy % 2 === 1) {
                arrayCopyTypedArray(auxF64, auxStart, arrayF64, start, n);
            }
            [arrayF64, auxF64] = [auxF64, arrayF64];
            [start, auxStart] = [auxStart, start];
        }
    }
}
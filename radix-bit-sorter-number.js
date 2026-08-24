import {
    arrayCopy, arrayCopyTypedArray, calculateSumOffsets,
    getSections,
    getSortOptions,
    reverse,
    validateSortRange
} from "./sorter-utils.js";
import {
    calculateMaskNumber,
    getMaskAsArrayNumber, partitionF64NotStableUpperBit,
    partitionReverseF64NotStableUpperBit
} from "./sorter-utils-number.js";

export function radixBitSorterNumber(array, options) {
    let { start, endP1, asc } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let arrayFloat64 = array instanceof Float64Array ? array : new Float64Array(array);
    const buffer = arrayFloat64.buffer
    let arrayInt32 = new Int32Array(buffer); //[0] = lower 32 bits, [1] higher 32 bits

    let mask = calculateMaskNumber(arrayInt32, start, endP1);
    let bList = getMaskAsArrayNumber(mask);
    if (bList[0].length === 0 && bList[1].length === 0) {
        return;
    }
    if (bList[1][0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = asc ? partitionReverseF64NotStableUpperBit(arrayFloat64, arrayInt32, start, endP1) :
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
        let auxFloat64 = new Float64Array(Math.max(n1, n2));
        if (n1 > 1) {
            radixSortNumber(false, arrayInt32, arrayFloat64, start, finalLeft, bList1, auxFloat64);
        }
        if (n2 > 1) {
            radixSortNumber(true, arrayInt32, arrayFloat64, finalLeft, endP1, bList2, auxFloat64);
        }
    } else {
        let auxFloat64 = new Float64Array(endP1 - start);
        radixSortNumber(asc, arrayInt32, arrayFloat64, start, endP1, bList, auxFloat64);
        if ((arrayInt32[1] & (1 << 31)) !== 0) { //for special case -0
             reverse(arrayFloat64, start, endP1);
        }
    }

    arrayCopy(arrayFloat64, start, array, start, endP1 - start);
}

function partitionReverseStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = arrayF64[i];
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
    arrayCopyTypedArray(auxF64, 0, arrayF64, left, right);
    return left;
}

function partitionStableLastBitsNumber(asc, arrayI32, arrayF64, start, endP1, elementIndex, section, auxF64) {
    const mask = section.mask;
    const range = section.range;
    const count = new Int32Array(range);
    for (let i = start; i < endP1; ++i) {
        count[arrayI32[i * 2 + elementIndex] & mask]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; ++i) {
        let element = arrayF64[i];
        let elementShiftMasked = arrayI32[i * 2 + elementIndex] & mask;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index] = element;
    }
    arrayCopyTypedArray(auxF64, 0, arrayF64, start, (endP1 - start));
}

function partitionStableGroupBitsNumber(asc, arrayI32, arrayF64, start, endP1, elementIndex, section, auxF64) {
    const mask = section.mask;
    const shift = section.shift;
    const range = section.range;
    const count = new Int32Array(range);
    for (let i = start; i < endP1; ++i) {
        count[(arrayI32[i * 2 + elementIndex] & mask) >>> shift]++;
    }
    calculateSumOffsets(asc, count, range);
    for (let i = start; i < endP1; ++i) {
        let element = arrayF64[i];
        let elementShiftMasked = (arrayI32[i * 2 + elementIndex] & mask) >>> shift;
        let index = count[elementShiftMasked];
        count[elementShiftMasked]++;
        auxF64[index] = element;
    }
    arrayCopyTypedArray(auxF64, 0, arrayF64, start, (endP1 - start));
}


function radixSortNumber(asc, arrayI32, arrayF64, start, endP1, bList, auxF64) {
    for (let elementIndex = 0; elementIndex <= 1; elementIndex++) {
        let sections = getSections(bList[elementIndex]);
        for (let index = 0; index < sections.length; index++) {
            let section = sections[index];
            let bits = section.bits;
            let shift = section.shift;
            let mask = section.mask
            if (bits === 1) {
                if (asc){
                    partitionStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64);
                } else {
                    partitionReverseStableNumber(arrayI32, arrayF64, start, endP1, mask, elementIndex, auxF64);
                }
            } else {
                if (shift === 0) {
                    partitionStableLastBitsNumber(asc, arrayI32, arrayF64, start, endP1, elementIndex, section, auxF64);
                } else {
                    partitionStableGroupBitsNumber(asc, arrayI32, arrayF64, start, endP1, elementIndex, section, auxF64);
                }
            }
        }
    }
}
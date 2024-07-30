import {
    arrayCopy, getSections,
} from "./sorter-utils.js";
import {calculateMaskNumber, getMaskAsArrayNumber} from "./sorter-utils-number.js";

export function radixBitSorterObjectNumber(arrayObj, mapper, start, endP1) {
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
            nans.push(element);
            continue;
        }
        if (i !== j) {
            arrayObj[j] = element;
        }
        arrayFloat64[j] = element;
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
    const buffer = arrayFloat64.buffer
    let arrayInt32 = new Int32Array(buffer); //[0] = lower 32 bits, [1] higher 32 bits

    let mask = calculateMaskNumber(arrayInt32, start, endP1, mapper);
    let bList = getMaskAsArrayNumber(mask);
    if (bList[0].length === 0 && bList[1].length === 0) {
        return;
    }
    let auxFloat64 = new Float64Array(endP1 - start);
    let auxObj = Array(endP1 - start).fill(null);

    if (bList[1].length > 0 && bList[1][0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseStableNumber(arrayInt32, arrayFloat64, arrayObj, start, endP1, 1 << 31, 1, auxFloat64, auxObj);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) { //sort negative numbers
            let bList1 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, start, finalLeft));
            if (!(bList1[0].length === 0 && bList1[1].length === 0)) {
                radixSortNumber(false, arrayInt32, arrayFloat64, arrayObj, start, finalLeft, bList1, auxFloat64, auxObj);
            }
        }
        if (n2 > 1) { //sort positive numbers
            let bList2 = getMaskAsArrayNumber(calculateMaskNumber(arrayInt32, finalLeft, endP1));
            if (!(bList2[0].length === 0 && bList2[1].length === 0)) {
                radixSortNumber(true, arrayInt32, arrayFloat64, arrayObj, finalLeft, endP1, bList2, auxFloat64, auxObj);
            }
        }
    } else {
        if ((arrayInt32[1] & (1 << 31)) !== 0) { //for special case -0
            radixSortNumber(false, arrayInt32, arrayFloat64, arrayObj, start, endP1, bList, auxFloat64, auxObj);
        } else {
            radixSortNumber(true, arrayInt32, arrayFloat64, arrayObj, start, endP1, bList, auxFloat64, auxObj);
        }
    }
}

function radixSortNumber(asc, arrayI32, arrayF64, arrayObj, start, endP1, bList, auxF64, auxObj) {
    for (let elementIndex =0; elementIndex<=1; elementIndex++) {
        let sections = getSections(bList[elementIndex]);
        for (let index = 0; index < sections.length; index++) {
            let section = sections[index];
            let bits = section.bits;
            let shift = section.shift;
            let mask = section.mask;
            if (bits === 1) {
                if (asc) {
                    partitionStableNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, auxF64, auxObj);
                } else {
                    partitionReverseStableNumber(arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, auxF64, auxObj);
                }
            } else {
                let dRange = 1 << bits;
                if (shift === 0) {
                    partitionStableLastBitsNumber(asc, arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, dRange, auxF64, auxObj);
                } else {
                    partitionStableGroupBitsNumber(asc, arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, shift, dRange, auxF64, auxObj);
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

function partitionStableLastBitsNumber(asc, arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, dRange, auxF64, auxObj) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[arrayI32[i * 2 + elementIndex] & mask]++;
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

function partitionStableGroupBitsNumber(asc, arrayI32, arrayF64, arrayObj, start, endP1, mask, elementIndex, shiftRight, dRange, auxF64, auxObj) {
    let count = Array(dRange).fill(0);
    for (let i = start; i < endP1; ++i) {
        count[(arrayI32[i * 2 + elementIndex] & mask) >>> shiftRight]++;
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


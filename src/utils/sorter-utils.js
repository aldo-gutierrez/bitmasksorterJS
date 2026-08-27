export function arrayCopy(src, srcPos, dst, dstPos, length) {
    while (length--) dst[dstPos++] = src[srcPos++];
    return dst;
}

export function arrayCopyTypedArray(src, srcPos, dst, dstPos, length) {
    dst.set(src.subarray(srcPos, srcPos + length), dstPos);
}

export function swap(array, left, right) {
    let aux = array[left];
    array[left] = array[right];
    array[right] = aux;
}

export function reverse(array, start, endP1) {
    let length = endP1 - start;
    let ld2 = length / 2;
    let end = endP1 - 1;
    for (let i = 0; i < ld2; ++i) {
        swap(array, start + i, end - i);
    }
}

export function rotateLeft(array, start, endP1, d) {
    let n = endP1 - start;
    d = d % n;
    if (d === 0) {
        return;
    }
    if (n - d < d) {
        rotateRight(array, start, endP1, n - d);
        return;
    }
    if (d === 1) {
        let aux = array[start];
        for (let i = start + 1; i < endP1; i++) {
            array[i - 1] = array[i];
        }
        array[endP1 - 1] = aux;
    } else {
        reverse(array, start, start + d);
        reverse(array, start + d, endP1);
        reverse(array, start, endP1);
    }
}

export function rotateRight(array, start, endP1, d) {
    let n = endP1 - start;
    d = d % n;
    if (d === 0) {
        return;
    }
    if (n - d < d) {
        rotateLeft(array, start, endP1, n - d);
        return;
    }
    if (d === 1) {
        let aux = array[endP1 - 1];
        for (let i = endP1 - 1; i > start; i--) {
            array[i] = array[i - 1];
        }
        array[start] = aux;
    } else {
        reverse(array, start, endP1);
        reverse(array, start, start + d);
        reverse(array, start + d, endP1);
    }
}

export function calculateSumOffsets(asc, count, countLength) {
    if (asc) {
        for (let i = 0, sum = 0; i < countLength; ++i) {
            let c = count[i];
            count[i] = sum;
            sum += c;
        }
    } else {
        for (let i = countLength - 1, sum = 0; i >= 0; --i) {
            let c = count[i];
            count[i] = sum;
            sum += c;
        }
    }
}

//11bits looks faster than 8 on AMD 4800H, 8 should be faster on dual-core CPUs
const MAX_BITS_RADIX_SORT = 11;

function reverseListGet(bList, index) {
    return bList[bList.length - 1 - index];
}

export function getSections(bList, maxBitsDigit) {
    if (!bList || bList.length === 0) {
        return [];
    }
    if (!maxBitsDigit) {
        maxBitsDigit = MAX_BITS_RADIX_SORT;
    }
    let sections = [];
    let b = 0;
    let shift = reverseListGet(bList, b);
    let bits = 1;
    b++;
    while (b < bList.length) {
        let bitIndex = reverseListGet(bList, b);
        if (bitIndex <= shift + maxBitsDigit - 1) {
            bits = (bitIndex - shift + 1);
        } else {
            let start = shift + bits - 1;
            sections.push({ bits: bits, shift: shift, start: start, mask: getMaskRangeBits(start, shift), range: (1 << bits) });
            shift = bitIndex;
            bits = 1;
        }
        b++;
    }
    let start = shift + bits - 1
    sections.push({ bits: bits, shift: shift, start: start, mask: getMaskRangeBits(start, shift), range: (1 << bits) });
    return sections;
}

export function getMaskAsArray(mask) {
    let res = [];
    for (let i = 31; i >= 0; i--) {
        if (((mask >> i) & 1) === 1) {
            res.push(i);
        }
    }
    return res;
}

export function getMaskRangeBits(bStart, bEnd) {
    let bits = bStart + 1 - bEnd;
    if (bits >= 32) return -1;
    return ((1 << bits) - 1) << bEnd;
}

export function getMaskLastBits(bList, bListStart) {
    let mask = 0;
    for (let i = bListStart; i < bList.length; i++) {
        let bIndex = bList[i];
        mask = mask | 1 << bIndex;
    }
    return mask;
}

function normalizeSortOrder(order) {
    if (typeof order === 'boolean') {
        return order;
    }
    if (typeof order === 'string') {
        switch (order.trim().toUpperCase()) {
            case 'DESC':
            case 'DECREASING':
            case 'DOWN':
                return false;
            case 'ASC':
            case 'ASCENDING':
            case 'UP':
            case 'INCREASING':
            default:
                return true;
        }
    }
    return true;
}

function normalizeNullsOrder(nulls) {
    if (typeof nulls === 'string') {
        switch (nulls.trim().toLowerCase()) {
            case 'first':
            case 'nulls_first':
            case 'nulls-first':
                return 'first';
            case 'last':
            case 'nulls_last':
            case 'nulls-last':
                return 'last';
            case 'ignore':
            case 'nulls_ignore':
            case 'nulls-ignore':
                return 'ignore';
            default:
                return 'last';
        }
    }
    return 'ignore';
}

export function getSortOptions(options) {
    let asc = true;
    let nulls = 'ignore';
    let start;
    let endP1;
    if (options && typeof options === 'object' && !Array.isArray(options)) {
        start = options.start;
        endP1 = options.end;
        if (options.order !== undefined) {
            asc = normalizeSortOrder(options.order);
        }
        if (options.nulls !== undefined) {
            nulls = normalizeNullsOrder(options.nulls);
        } else if (options.nullOrder !== undefined) {
            nulls = normalizeNullsOrder(options.nullOrder);
        }
    }
    return { start, endP1, asc, nulls };
}

export const getSortRangeOptions = getSortOptions;

export function validateSortRange(array, start, endP1) {
    if (start === undefined) {
        start = 0;
    }
    if (endP1 === undefined) {
        endP1 = array.length;
    }
    if (!Number.isInteger(start) || !Number.isInteger(endP1)) {
        throw new RangeError('start and endP1 must be integers');
    }
    if (start < 0 || start > array.length) {
        throw new RangeError(`start ${start} is out of bounds for array length ${array.length}`);
    }
    if (endP1 < start || endP1 > array.length) {
        throw new RangeError(`endP1 ${endP1} is out of bounds for array length ${array.length}`);
    }
    return { start, endP1 };
}

export function handleNullsUndefinedAndNans(arrayObj, nulls, start, endP1, mapper, arrayNativeF) {
    const isTypedArray = ArrayBuffer.isView(arrayObj) && !(arrayObj instanceof DataView);
    if (isTypedArray) {
        return {start, endP1, arrayObj, undefined, start2: start, end2: endP1};
    }

    if (nulls === "ignore") {
        if (!arrayNativeF) {
            return {start, endP1, arrayObj, undefined, start2: start, end2: endP1};
        }

        const n = endP1 - start;
        const arrayNative = arrayNativeF(n);
        if (mapper) {
            for (let i = 0; i < n; i++) {
                arrayNative[i] = mapper(arrayObj[start + i]);
            }
        } else {
            for (let i = 0; i < n; i++) {
                arrayNative[i] = arrayObj[start + i];
            }
        }
        return { start, endP1, arrayNative };
    }

    if (nulls === "first") {
        for (let i = start; i < endP1; i++) {
            const elementObj = arrayObj[i];
            if (elementObj === null) {
                start++;
            } else {
                break
            }
        }
    }

    let arrayNative;
    if (arrayNativeF) {
        arrayNative = arrayNativeF(endP1 - start);
    }

    // Counters and collectors - must be declared before use
    let nullValues = 0;
    let undefinedValues = 0;
    const nullKeyObjs = [];
    const undefinedKeyObjs = [];

    let writeIndex = 0;
    if (mapper) {
        for (let i = start; i < endP1; i++) {
            const elementObj = arrayObj[i];
            // If the element object itself is null/undefined, treat accordingly without calling mapper
            if (elementObj === null) {
                nullValues++;
                continue;
            }
            if (elementObj === undefined) {
                undefinedValues++;
                continue;
            }
            const valueToCheck = mapper(elementObj);
            if (valueToCheck === null) {
                nullKeyObjs.push(elementObj);
                continue;
            }
            if (valueToCheck === undefined) {
                undefinedKeyObjs.push(elementObj);
                continue;
            }
            if (arrayNative) arrayNative[writeIndex] = valueToCheck;
            if (i !== start + writeIndex) arrayObj[start + writeIndex] = elementObj;
            writeIndex++;
        }
    } else {
        for (let i = start; i < endP1; i++) {
            const elementObj = arrayObj[i];
            // If the element object itself is null/undefined, treat accordingly without calling mapper
            if (elementObj === null) {
                nullValues++;
                continue;
            }
            if (elementObj === undefined) {
                undefinedValues++;
                continue;
            }
            if (arrayNative) arrayNative[writeIndex] = elementObj;
            if (i !== start + writeIndex) arrayObj[start + writeIndex] = elementObj;
            writeIndex++;
        }
    }

    const n = writeIndex;

    // adjust arrayObj according to nulls placement and update endP1
    if (nulls === "last") {
        // place nulls and undefineds after the compacted block - restore original objects
        let pos = start + n;
        for (let t = 0; t < nullKeyObjs.length; t++) {
            arrayObj[pos++] = nullKeyObjs[t];
        }
        for (let t = 0; t < undefinedKeyObjs.length; t++) {
            arrayObj[pos++] = undefinedKeyObjs[t];
        }
        for (let t = 0; t < nullValues; t++) {
            arrayObj[pos++] = null;
        }
        for (let t = 0; t < undefinedValues; t++) {
            arrayObj[pos++] = undefined;
        }
        const newEndP1 = start + n;
        return {start, endP1: newEndP1, arrayNative, start2: start, end2: start + n + nullKeyObjs.length + undefinedKeyObjs.length};
    } else { // nulls === "first"
        // shift compacted block right by totalNulls to make space for nulls at start
        let totalNulls = nullValues + nullKeyObjs.length;
        if (totalNulls > 0) {
            for (let i = n - 1; i >= 0; i--) {
                const elementObj = arrayObj[start + i];
                arrayObj[start + i + totalNulls] = elementObj;
            }
        }
        // write null objects at [start .. start+nullValues-1]
        for (let i = 0; i < nullValues; i++) arrayObj[start + i] = null;
        for (let i = 0; i < nullKeyObjs.length; i++) arrayObj[start + i + nullValues] = nullKeyObjs[i];
        // write undefineds from start + totalNulls + n to endP1-1
        for (let i = start + totalNulls + n, t = 0; i < endP1 && t < undefinedKeyObjs.length; i++, t++) arrayObj[i] = undefinedKeyObjs[t];
        for (let i = start + totalNulls + n + undefinedKeyObjs.length, t = 0; i < endP1 && t < undefinedValues; i++, t++) arrayObj[i] = undefined;
        const newStart = start + totalNulls;
        const newEndP1 = start + totalNulls + n;
        return {start: newStart, endP1: newEndP1, arrayNative, start2: start + nullValues, end2: start + n + undefinedKeyObjs.length};
    }
}
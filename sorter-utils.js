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

export function getSortOptions(options, start, endP1) {
    let asc = true;
    if (options && typeof options === 'object' && !Array.isArray(options)) {
        start = options.start;
        endP1 = options.end;
        if (options.order !== undefined) {
            asc = normalizeSortOrder(options.order);
        }
    } else if (options !== undefined) {
        start = options;
    }
    return { start, endP1, asc };
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
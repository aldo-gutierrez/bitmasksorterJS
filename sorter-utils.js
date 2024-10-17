export function arrayCopy(src, srcPos, dst, dstPos, length) {
    while (length--) dst[dstPos++] = src[srcPos++];
    return dst;
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
            sections.push({bits: bits, shift: shift, start: start, mask: getMaskRangeBits(start, shift)});
            shift = bitIndex;
            bits = 1;
        }
        b++;
    }
    let start = shift + bits - 1
    sections.push({bits: bits, shift: shift, start: start, mask: getMaskRangeBits(start, shift)});
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
    return ((1 << bStart + 1 - bEnd) - 1) << bEnd;
}

export function getMaskLastBits(bList, bListStart) {
    let mask = 0;
    for (let i = bListStart; i < bList.length; i++) {
        let bIndex = bList[i];
        mask = mask | 1 << bIndex;
    }
    return mask;
}
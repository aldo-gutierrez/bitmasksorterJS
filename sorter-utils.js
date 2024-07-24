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

//11bits looks faster than 8 on AMD 4800H, 8 should be faster on dual core CPUs
const MAX_BITS_RADIX_SORT = 11;

function reverseListGet(bList, index) {
    return bList[bList.length - 1 - index];
}

export function getSections(bList) {
    if (!bList || bList.length === 0) {
        return [];
    }
    let maxBitsDigit = MAX_BITS_RADIX_SORT;
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
            sections.push([bits, shift, shift + bits - 1]);
            shift = bitIndex;
            bits = 1;
        }
        b++;
    }
    sections.push([bits, shift, shift + bits - 1]);
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


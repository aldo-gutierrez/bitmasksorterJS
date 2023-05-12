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

export function partitionReverseNotStableUpperBit(array, start, endP1) {
    let left = start;
    let right = endP1 - 1;

    while (left <= right) {
        let element = array[left];
        if (element >= 0) {
            while (left <= right) {
                element = array[right];
                if (element >= 0) {
                    right--;
                } else {
                    swap(array, left, right);
                    left++;
                    right--;
                    break;
                }
            }
        } else {
            left++;
        }
    }
    return left;
}

//11bits looks faster than 8 on AMD 4800H, 15 is slower
const MAX_BITS_RADIX_SORT = 11;

export function getSections(bList) {
    let sections = [];
    let kIndexStart = bList.length - 1;
    let kIndexEnd = 0;
    for (let i = kIndexStart; i >= kIndexEnd; i--) {
        let bListI = bList[i];
        let maskI = 1 << bListI;
        let bits = 1;
        let imm = 0;
        for (let j = 1; j <= MAX_BITS_RADIX_SORT - 1; j++) {
            if (i - j >= kIndexEnd) {
                let bListIm1 = bList[i - j];
                if (bListIm1 === bListI + j) {
                    maskI = maskI | 1 << bListIm1;
                    bits++;
                    imm++;
                } else {
                    break;
                }
            }
        }
        i -= imm;
        sections.push([maskI, bits, bListI])
    }
    return sections;
}

export  function getMaskAsArray(mask) {
    let res = [];
    for (let i = 31; i >= 0; i--) {
        if (((mask >> i) & 1) === 1) {
            res.push(i);
        }
    }
    return res;
}

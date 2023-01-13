function arraycopy(src, srcPos, dst, dstPos, length) {
    while (length--) dst[dstPos++] = src[srcPos++];
    return dst;
}

function getMaskBit(array, start, end) {
    let mask = 0x00000000;
    let inv_mask = 0x00000000;
    for (let i = start; i < end; i++) {
        let ei = array[i];
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
}

function getMaskAsArray(mask) {
    let res = [];
    for (let i = 31; i >= 0; i--) {
        if (((mask >> i) & 1) === 1) {
            res.push(i);
        }
    }
    return res;
}

function swap(array, left, right) {
    let aux = array[left];
    array[left] = array[right];
    array[right] = aux;
}


function partitionNotStable(array, start, end, mask) {
    let left = start;
    let right = end - 1;

    while (left <= right) {
        let element = array[left];
        if ((element & mask) === 0) {
            left++;
        } else {
            while (left <= right) {
                element = array[right];
                if ((element & mask) === 0) {
                    swap(array, left, right);
                    left++;
                    right--;
                    break;
                } else {
                    right--;
                }
            }
        }
    }
    return left;
}

function partitionReverseNotStable(array, start, end, mask) {
    let left = start;
    let right = end - 1;

    while (left <= right) {
        let element = array[left];
        if ((element & mask) === 0) {
            while (left <= right) {
                element = array[right];
                if (((element & mask) === 0)) {
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

function partitionStable(array, start, end, mask, aux) {
    let left = start;
    let right = 0;
    for (let i = start; i < end; i++) {
        let element = array[i];
        if ((element & mask) === 0) {
            array[left] = element;
            left++;
        } else {
            aux[right] = element;
            right++;
        }
    }
    arraycopy(aux, 0, array, left, right);
    return left;
}

function partitionStableLastBits(array, start, end, mask, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < end; i++) {
        count[array[i] & mask]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < end; i++) {
        let element = array[i];
        aux[count[element & mask]++] = element;
    }
    arraycopy(aux, 0, array, start, end - start);
}

function partitionStableGroupBits(array, start, end, mask, shiftRight, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < end; i++) {
        count[(array[i] & mask) >> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < end; i++) {
        let element = array[i];
        aux[count[(element & mask) >> shiftRight]++] = element;
    }
    arraycopy(aux, 0, array, start, end - start);
}


function sort(array) {
    let unsigned = false;
    if (array.length < 2) {
        return;
    }
    let start = 0;
    let end = array.length;

    let mask = getMaskBit(array, start, end);
    let kList = getMaskAsArray(mask);
    if (kList.length === 0) {
        return;
    }
    if (kList[0] === 31) { //there are negative numbers and positive numbers
        let sortMask = 1 << kList[0];
        let finalLeft = unsigned
            ? partitionNotStable(array, start, end, sortMask)
            : partitionReverseNotStable(array, start, end, sortMask);
        let n1 = finalLeft - start;
        let n2 = end - finalLeft;
        let aux = Array(max(n1, n2)).fill(0);
        if (n1 > 1) { //sort negative numbers
            mask = getMaskBit(array, start, finalLeft);
            kList = getMaskAsArray(mask);
            radixSort(array, start, finalLeft, kList, kList.length - 1, 0, aux);
        }
        if (n2 > 1) { //sort positive numbers
            mask = getMaskBit(array, finalLeft, end);
            kList = getMaskAsArray(mask);
            radixSort(array, finalLeft, end, kList, kList.length - 1, 0, aux);
        }
    } else {
        let aux = Array(end - start).fill(0);
        radixSort(array, start, end, kList, kList.length - 1, 0, aux);
    }
}

function radixSort(array, start, end, kList, kIndexStart, kIndexEnd, aux) {
    for (let i = kIndexStart; i >= kIndexEnd; i--) {
        let kListI = kList[i];
        let maskI = 1 << kListI;
        let bits = 1;
        let imm = 0;
        for (let j = 1; j <= 11; j++) { //11bits looks faster than 8 on AMD 4800H, 15 is slower
            if (i - j >= kIndexEnd) {
                let kListIm1 = kList[i - j];
                if (kListIm1 === kListI + j) {
                    let maskIm1 = 1 << kListIm1;
                    maskI = maskI | maskIm1;
                    bits++;
                    imm++;
                } else {
                    break;
                }
            }
        }
        i -= imm;
        if (bits === 1) {
            partitionStable(array, start, end, maskI, aux);
        } else {
            let twoPowerBits = 1 << bits;
            if (kListI === 0) {
                partitionStableLastBits(array, start, end, maskI, twoPowerBits, aux);
            } else {
                partitionStableGroupBits(array, start, end, maskI, kListI, twoPowerBits, aux);
            }
        }
    }
}


console.log("Comparing Sorters\n");

let totalElapsedP = 0;
let totalElapsedK = 0;

const iterations = 20;
const range = 1000;
const size = 1000000;
//const range = 1000000000;
//const size = 40000000;

for (let i = 0; i < iterations; i++) {
    let aux = Array.from({length: size}, () => Math.floor(Math.random() * range));
    let array = Array(size);
    arraycopy(aux, 0, array, 0, size);
    let start = performance.now();
    array.sort(function (a, b) {
        return a - b;
    });
    let end = performance.now();
    let elapsedP = end - start;

    array = Array(size);
    arraycopy(aux, 0, array, 0, size);
    start = performance.now();
    sort(array);
    end = performance.now();
    let elapsedK = end - start;

    aux.sort(function (a, b) {
        return a - b;
    });

    let equal = aux.length === array.length && aux.every(function (value, index) {
        return value === array[index]
    })
    if (!equal) {
        console.log("Arrays Not Equal");
        console.log(aux);
        console.log(array);
    }
    console.log("Elapsed Javascript     time: " + elapsedP + " ms.");
    console.log("Elapsed RadixBitSorter time:  " + elapsedK + " ms.");
    console.log("");

    totalElapsedP += elapsedP;
    totalElapsedK += elapsedK;
}

console.log("AVG elapsed Javascript     time: " + (totalElapsedP / iterations) + " ms.");
console.log("AVG elapsed RadixBitSorter time:  " + (totalElapsedK / iterations) + " ms.");
console.log("\n");
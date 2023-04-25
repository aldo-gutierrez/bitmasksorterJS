function arraycopy(src, srcPos, dst, dstPos, length) {
    while (length--) dst[dstPos++] = src[srcPos++];
    return dst;
}

function calculateMask(maskInfo, array, start, endP1) {
    let mask = maskInfo.zero;
    let inv_mask = maskInfo.zero;
    for (let i = start; i < endP1; i++) {
        let ei = array[i];
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
}

function getMaskAsArray(maskInfo, mask) {
    let res = [];
    for (let i = maskInfo.upperBit; i >= maskInfo.zero; i--) {
        if (((mask >> i) & maskInfo.one) === maskInfo.one) {
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


function partitionNotStable(maskInfo, array, start, endP1, mask) {
    let left = start;
    let right = endP1 - 1;

    while (left <= right) {
        let element = array[left];
        if ((element & mask) === maskInfo.zero) {
            left++;
        } else {
            while (left <= right) {
                element = array[right];
                if ((element & mask) === maskInfo.zero) {
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

function partitionReverseNotStable(maskInfo, array, start, endP1, mask) {
    let left = start;
    let right = endP1 - 1;

    while (left <= right) {
        let element = array[left];
        if ((element & mask) === maskInfo.zero) {
            while (left <= right) {
                element = array[right];
                if (((element & mask) === maskInfo.zero)) {
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

function partitionStable(maskInfo, array, start, endP1, mask, aux) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        if ((element & mask) === maskInfo.zero) {
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

function partitionStableLastBits(maskInfo, array, start, endP1, mask, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i] & mask]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[element & mask]++] = element;
    }
    arraycopy(aux, 0, array, start, endP1 - start);
}

function partitionStableGroupBits(maskInfo, array, start, endP1, mask, shiftRight, twoPowerK, aux) {
    let count = Array(twoPowerK).fill(0);
    for (let i = start; i < endP1; i++) {
        count[(array[i] & mask) >> shiftRight]++;
    }
    for (let i = 0, sum = 0; i < twoPowerK; i++) {
        let c = count[i];
        count[i] = sum;
        sum += c;
    }
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        aux[count[(element & mask) >> shiftRight]++] = element;
    }
    arraycopy(aux, 0, array, start, endP1 - start);
}

function sort(maskInfo, arrayParam, start, endP1) {
    let unsigned = false;
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let array;
    let float64Array;
    if (BigInt(maskInfo.upperBit) === 63n) {
        float64Array = new Float64Array(arrayParam);
        const buffer = float64Array.buffer
        array = new BigInt64Array(buffer);
    } else {
        array = arrayParam;
    }

    let mask = calculateMask(maskInfo, array, start, endP1);
    let kList = getMaskAsArray(maskInfo, mask);
    if (kList.length === 0) {
        return;
    }
    if (kList[0] === maskInfo.upperBit) { //there are negative numbers and positive numbers
        let sortMask = maskInfo.one << kList[0];
        let finalLeft = unsigned
            ? partitionNotStable(maskInfo, array, start, endP1, sortMask)
            : partitionReverseNotStable(maskInfo, array, start, endP1, sortMask);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let aux = Array(max(n1, n2)).fill(maskInfo.zero);
        if (n1 > 1) { //sort negative numbers
            mask = calculateMask(maskInfo, array, start, finalLeft);
            kList = getMaskAsArray(maskInfo, mask);
            radixSort(maskInfo, array, start, finalLeft, kList, kList.length - 1, 0, aux);
        }
        if (n2 > 1) { //sort positive numbers
            mask = calculateMask(maskInfo, array, finalLeft, endP1);
            kList = getMaskAsArray(maskInfo, mask);
            radixSort(maskInfo, array, finalLeft, endP1, kList, kList.length - 1, 0, aux);
        }
    } else {
        let aux = Array(endP1 - start).fill(maskInfo.zero);
        radixSort(maskInfo, array, start, endP1, kList, kList.length - 1, 0, aux);
    }
    if (BigInt(maskInfo.upperBit) === 63n) {
        arraycopy(float64Array, 0, arrayParam, start, endP1 - start);
    }
}

//11bits looks faster than 8 on AMD 4800H, 15 is slower
const MAX_BITS_RADIX_SORT = 11;

function getSections(maskInfo, kList, kIndexStart, kIndexEnd) {
    let sections = [];
    for (let i = kIndexStart; i >= kIndexEnd; i--) {
        let kListI = kList[i];
        let maskI = maskInfo.one << kListI;
        let bits = 1;
        let imm = 0;
        for (let j = 1; j <= MAX_BITS_RADIX_SORT - 1; j++) {
            if (i - j >= kIndexEnd) {
                let kListIm1 = kList[i - j];
                if (kListIm1 === kListI + maskInfo.convert(j)) {
                    maskI = maskI | maskInfo.one << kListIm1;
                    bits++;
                    imm++;
                } else {
                    break;
                }
            }
        }
        i -= imm;
        sections.push([maskI, bits, kListI])
    }
    return sections;
}

function radixSort(maskinfo, array, start, end, kList, kIndexStart, kIndexEnd, aux) {
    let sections = getSections(maskinfo, kList, kIndexStart, kIndexEnd);
    for (let index = 0; index < sections.length; index++) {
        [maskI, bits, shift] = sections[index];
        if (bits === 1) {
            partitionStable(maskinfo, array, start, end, maskI, aux);
        } else {
            let twoPowerBits = 1 << bits;
            if (shift === 0) {
                partitionStableLastBits(maskinfo, array, start, end, maskI, twoPowerBits, aux);
            } else {
                partitionStableGroupBits(maskinfo, array, start, end, maskI, shift, twoPowerBits, aux);
            }
        }
    }
}

function sortInt(array) {
    var maskInfoInt = {"zero": 0, "one": 1, "upperBit": 31, "convert": (x) => { return x}};
    sort(maskInfoInt, array, 0, array.length);
}

function sortFloat(array) {
    var maskInfoLong = {"zero": 0n, "one": 1n, "upperBit": 63n, "convert": (x) => { return BigInt(x)}};
    sort(maskInfoLong, array, 0, array.length);
}

console.log("Comparing Sorters\n");

let totalElapsedP = 0;
let totalElapsedK = 0;
let totalElapsedK2 = 0;

const iterations = 20;
const range = 1000;
const size = 1000000;
//const range = 1000000000;
//const size = 40000000;

for (let i = 0; i < iterations; i++) {
    let orig = Array.from({length: size}, () => Math.floor(Math.random() * range));
    let arrayJS = Array(size);
    arraycopy(orig, 0, arrayJS, 0, size);
    let start = performance.now();
    arrayJS.sort(function (a, b) {
        return a - b;
    });
    let end = performance.now();
    let elapsedP = end - start;

    let arrayR1 = Array(size);
    arraycopy(orig, 0, arrayR1, 0, size);
    start = performance.now();
    sortInt(arrayR1);
    end = performance.now();
    let elapsedK = end - start;

    let arrayR2= Array(size);
    arraycopy(orig, 0, arrayR2, 0, size);
    start = performance.now();
    sortFloat(arrayR2);
    end = performance.now();
    let elapsedK2 = end - start;

    let equal = arrayJS.length === arrayR1.length && arrayJS.every(function (value, index) {
        return value === arrayR1[index]
    })
    if (!equal) {
        console.log("Arrays Not Equal RadixBitSorterInt");
        console.log("OK:  " + arrayJS);
        console.log("NOK: " + arrayR1);
    }

    equal = arrayJS.length === arrayR2.length && arrayJS.every(function (value, index) {
        return value === arrayR2[index]
    })
    if (!equal) {
        console.log("Arrays Not Equal RadixBitSorterFloat");
        console.log("OK:  " + arrayJS);
        console.log("NOK: " + arrayR2);
    }

    console.log("Elapsed Javascript          time:  " + elapsedP + " ms.");
    console.log("Elapsed RadixBitSorterInt   time:  " + elapsedK + " ms.");
    console.log("Elapsed RadixBitSorterFloat time:  " + elapsedK2 + " ms.");
    console.log("");
    totalElapsedP += elapsedP;
    totalElapsedK += elapsedK;
    totalElapsedK2 += elapsedK2;

}

console.log("AVG elapsed Javascript          time: " + (totalElapsedP / iterations) + " ms.");
console.log("AVG elapsed RadixBitSorterInt   time:  " + (totalElapsedK / iterations) + " ms.");
console.log("AVG elapsed RadixBitSorterFloat time:  " + (totalElapsedK2 / iterations) + " ms.");

console.log("\n");




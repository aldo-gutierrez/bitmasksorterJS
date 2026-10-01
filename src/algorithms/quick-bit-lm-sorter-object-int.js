import {
    getMaskAsArray,
    getSortOptions,
    handleNullsUndefinedAndNans,
    validateSortRange,
    Q, R, X,
} from "../utils/sorter-utils.js";
import {
    calculateMaskInt,
    partitionReverseStableLowMemInt,
    partitionStableLowMemInt
} from "../utils/sorter-utils-object-int.js";
import {radixSortObjectInt32Mapper} from "./radix-bit-sorter-object-int.js";
import {radixSortObjectI32Array} from "./radix-bit-v2-sorter-object-int.js";


let sorterMapObjectInt32 =     [
    [ X, R, X, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q ],
    [ X, Q, Q, Q, Q, Q, Q, Q, R, Q, R, Q, Q, X, Q, X, X, Q ],
    [ X, X, X, X, Q, Q, X, X, X, X, Q, Q, Q, Q, Q, Q, Q, Q ],
    [ X, X, X, X, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q ],
    [ Q, X, X, X, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q ],
    [ X, Q, X, X, Q, Q, X, R, Q, Q, Q, Q, Q, X, Q, Q, Q, X ],
    [ Q, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X ],
    [ Q, Q, X, X, X, X, X, R, X, X, X, X, X, X, X, X, X, X ],
    [ X, X, X, X, X, X, X, X, X, X, X, R, X, X, X, R, X, X ],
    [ X, X, X, X, X, X, X, X, X, R, R, X, X, X, X, X, R, X ],
    [ X, X, X, X, X, X, X, X, X, X, X, R, R, R, X, R, R, R ],
    [ X, X, X, X, X, X, X, X, X, X, X, R, R, R, R, R, R, R ],
    [ X, X, X, X, X, X, X, X, X, X, X, R, R, R, R, R, R, R ],
    [ X, X, X, X, X, X, X, X, X, X, X, R, R, R, R, R, R, R ],
    [ X, X, X, X, X, X, X, X, X, X, X, R, R, R, R, R, R, R ],
    [ X, X, X, X, X, X, X, X, X, X, X, R, R, R, R, R, R, R ],
    [ X, X, R, X, X, X, X, R, X, R, X, R, R, R, R, R, R, R ],
    [ R, R, X, X, X, X, X, X, X, X, X, R, R, R, R, R, R, R ]
]

/**
 * No extra memory or limited size extra memory Quick Bit Sort
 *   No optimization for small n and small range implemented yet
 */
export function quickBitLowMemSortObjectByInt32Key(array, mapper, options = {}) {
    options.runtime = options.runtime || {};
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1, mapper));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let mask = options.runtime.mask ?? calculateMaskInt(array, start, endP1, mapper);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }

    let aux = Array(getAuxSizeDefaultLowMem(n));
    options.runtime.aux = aux;
    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = asc ? partitionReverseStableLowMemInt(array, start, endP1, 1 << 31, mapper, aux)
            : partitionStableLowMemInt(array, start, endP1, 1 << 31, mapper, aux);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let mask1 = 0;
        let mask2 = 0;
        if (n1 > 1) { //sort negative numbers
            mask1 = calculateMaskInt(array, start, finalLeft, mapper);
            if (mask1 === 0) {
                n1 = 0;
            }
        }
        if (n2 > 1) { //sort positive numbers
            mask2 = calculateMaskInt(array, finalLeft, endP1, mapper);
            if (mask2 === 0) {
                n2 = 0;
            }
        }
        if (n1 > 1) {
            bList = getMaskAsArray(mask1);
            qbSortInt(asc, array, mapper, start, finalLeft, bList, 0, options.runtime, false);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            qbSortInt(asc, array, mapper, finalLeft, endP1, bList, 0, options.runtime, false);
        }
    } else {
        qbSortInt(asc, array, mapper, start, endP1, bList, 0, options.runtime, false);
    }
}

function getAuxSizeDefaultLowMem(n) {
    return Math.ceil(Math.log2(n) * Math.sqrt(n));
}

function qbSortInt(asc, array, mapper, start, endP1, bList, bListIndex, runtime, recalculate) {
    let aux = runtime.aux;
    let n = endP1 - start;
    if (recalculate && bListIndex < 3) {
        let mask = calculateMaskInt(array, start, endP1, mapper);
        bList = getMaskAsArray(mask);
        bListIndex = 0;
    }
    let kDiff = bList.length - bListIndex;
    if (kDiff < 1) {
        return;
    }


    let log2RangeM1 = bList.length - bListIndex - 1; //Log2(K)
    if (bListIndex > 1 && log2RangeM1 < 18 &&  n <= 262144 && aux.length >= n) {
        let log2SizeM1 = Math.ceil(Math.log2(n)) - 1; //Log2(N)
        let sorter = sorterMapObjectInt32[log2SizeM1][log2RangeM1];
        if (sorter === X) {
            radixSortObjectInt32Mapper(asc, array, start, endP1, bList.slice(bListIndex), aux, mapper);
            return;
        } else if (sorter === R) {
            runtime.arrayI32 ??= new Int32Array(getAuxSizeDefaultLowMem(n));
            runtime.auxI32 ??= new Int32Array(getAuxSizeDefaultLowMem(n));
            for (let i = 0; i < n; i++) {
                runtime.arrayI32[i] = mapper(array[start + i]);
            }
            radixSortObjectI32Array(asc, array, start, n, bList.slice(bListIndex), runtime.arrayI32, 0, runtime.auxI32, aux, 0);
            return;
        }
    }

    let sortMask = 1 << bList[bListIndex];
    let finalLeft = asc ? partitionStableLowMemInt(array, start, endP1, sortMask, mapper, aux)
        : partitionReverseStableLowMemInt(array, start, endP1, sortMask, mapper, aux);
    let recalculateBitMask = (finalLeft - start <= 1 || endP1 - finalLeft <= 1);
    if (finalLeft - start > 1) {
        qbSortInt(asc, array, mapper, start, finalLeft, bList, bListIndex + 1, runtime, recalculateBitMask);
    }
    if (endP1 - finalLeft > 1) {
        qbSortInt(asc, array, mapper, finalLeft, endP1, bList, bListIndex + 1, runtime, recalculateBitMask);
    }
}

import {
    getMaskAsArray,
    getSortOptions, handleNullsUndefinedAndNans,
    validateSortRange,
} from "../utils/sorter-utils.js";
import {
    calculateMaskInt,
    partitionStableLowMemInt, partitionReverseStableLowMemInt
} from "../utils/sorter-utils-object-int.js";

/**
 * No extra memory or limited size extra memory Quick Bit Sort
 *   No optimization for small n and small range implemented yet
 */
export function quickBitLowMemSortObjectByInt32Key(array, mapper, options) {
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1));
    n = endP1 - start;
    if (n < 2) {
        return;
    }
    let mask = calculateMaskInt(array, start, endP1, mapper);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }

    let aux = Array(Math.ceil(Math.log2(n) * Math.sqrt(n)));
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
            qbSortInt(asc, array, mapper, start, finalLeft, bList, 0, aux, false);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            qbSortInt(asc, array, mapper, finalLeft, endP1, bList, 0, aux, false);
        }
    } else {
        qbSortInt(asc, array, mapper, start, endP1, bList, 0, aux, false);
    }
}

function qbSortInt(asc, array, mapper, start, endP1, bList, bListIndex, aux, recalculate) {
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
    let sortMask = 1 << bList[bListIndex];
    let finalLeft = asc ? partitionStableLowMemInt(array, start, endP1, sortMask, mapper, aux)
        : partitionReverseStableLowMemInt(array, start, endP1, sortMask, mapper, aux);
    let recalculateBitMask = (finalLeft - start <= 1 || endP1 - finalLeft <= 1);
    if (finalLeft - start > 1) {
        qbSortInt(asc, array, mapper, start, finalLeft, bList, bListIndex + 1, aux, recalculateBitMask);
    }
    if (endP1 - finalLeft > 1) {
        qbSortInt(asc, array, mapper, finalLeft, endP1, bList, bListIndex + 1, aux, recalculateBitMask);
    }
}

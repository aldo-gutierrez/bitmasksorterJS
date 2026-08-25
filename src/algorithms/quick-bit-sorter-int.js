import {
    calculateMaskInt,
    partitionNotStable,
    partitionReverseNotStable,
    partitionReverseNotStableUpperBit
} from "../utils/sorter-utils-int.js";
import {getMaskAsArray, getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "../utils/sorter-utils.js";

export function quickBitSortInt32(array, options) {
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
    let mask = calculateMaskInt(array, start, endP1);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }

    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = asc ? partitionReverseNotStableUpperBit(array, start, endP1)
        : partitionNotStable(array, start, endP1, 1 << 31);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        let mask1 = 0;
        let mask2 = 0;
        if (n1 > 1) { //sort negative numbers
            mask1 = calculateMaskInt(array, start, finalLeft);
            if (mask1 === 0) {
                n1 = 0;
            }
        }
        if (n2 > 1) { //sort positive numbers
            mask2 = calculateMaskInt(array, finalLeft, endP1);
            if (mask2 === 0) {
                n2 = 0;
            }
        }
        if (n1 > 1) {
            bList = getMaskAsArray(mask1);
            qbSortInt(asc, array, start, finalLeft, bList, 0, false);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            qbSortInt(asc, array, finalLeft, endP1, bList, 0, false);
        }
    } else {
        qbSortInt(asc, array, start, endP1, bList, 0, false);
    }
}

function qbSortInt(asc, array, start, endP1, bList, bListIndex, recalculate) {
    let n = endP1 - start;
    if (recalculate && bListIndex < 3) {
        let mask = calculateMaskInt(array, start, endP1);
        bList = getMaskAsArray(mask);
        bListIndex = 0;
    }
    let kDiff = bList.length - bListIndex;
    if (kDiff < 1) {
        return;
    }

    let sortMask = 1 << bList[bListIndex];
    let finalLeft = asc ? partitionNotStable(array, start, endP1, sortMask)
        : partitionReverseNotStable(array, start, endP1, sortMask);
    let recalculateBitMask = (finalLeft - start <= 1 || endP1 - finalLeft <= 1);
    if (finalLeft - start > 1) {
        qbSortInt(asc, array, start, finalLeft, bList, bListIndex + 1, recalculateBitMask);
    }
    if (endP1 - finalLeft > 1) {
        qbSortInt(asc, array, finalLeft, endP1, bList, bListIndex + 1, recalculateBitMask);
    }
}
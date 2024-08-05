import {calculateMaskInt, partitionNotStable, partitionReverseNotStableUpperBit} from "./sorter-utils-int.js";
import {getMaskAsArray} from "./sorter-utils.js";

export function quickBitSorterInt(array, start, endP1) {
    if (!start) {
        start = 0;
    }
    if (!endP1) {
        endP1 = array.length;
    }
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let mask = calculateMaskInt(array, start, endP1);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }

    if (bList[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseNotStableUpperBit(array, start, endP1);
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
            qbSortInt(array, start, finalLeft, bList, 0, false);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            qbSortInt(array, finalLeft, endP1, bList, 0, false);
        }
    } else {
        qbSortInt(array, start, endP1, bList, 0, false);
    }
}

const SHORT_K_BITS = 20;

function qbSortInt(array, start, endP1, bList, bListIndex, recalculate) {
    let n = endP1 - start;
    if (recalculate && bListIndex < 3) {
        let mask = calculateMaskInt(array, start, endP1);
        bList = getMaskAsArray(mask);
        bListIndex = 0;
    }
    let kDiff = bList.length - bListIndex;
    if (kDiff <= SHORT_K_BITS) {
        if (kDiff < 1) {
            return;
        }
        // sortShortK(array, start, endP1, bList, bListIndex, null, 0);
        //return;
    }

    let sortMask = 1 << bList[bListIndex];
    let finalLeft = partitionNotStable(array, start, endP1, sortMask);
    let recalculateBitMask = (finalLeft - start <= 1 || endP1 - finalLeft <= 1);
    if (finalLeft - start > 1) {
        qbSortInt(array, start, finalLeft, bList, bListIndex + 1, recalculateBitMask);
    }
    if (endP1 - finalLeft > 1) {
        qbSortInt(array, finalLeft, endP1, bList, bListIndex + 1, recalculateBitMask);
    }
}
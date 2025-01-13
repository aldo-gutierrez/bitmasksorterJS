import {calculateSumOffsets, getMaskAsArray, getSections, swap} from "./sorter-utils.js";
import {calculateMaskInt, partitionReverseNotStableUpperBit} from "./sorter-utils-int.js";

export function aFlagBitSorterInt(array, start, endP1) {
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
            aFlagSortInt(array, start, finalLeft, bList);
        }
        if (n2 > 1) {
            bList = getMaskAsArray(mask2);
            aFlagSortInt(array, finalLeft, endP1, bList);
        }
    } else {
        aFlagSortInt(array, start, endP1, bList);
    }
}

function aFlagSortInt(array, start, endP1, bList) {
    let sections = getSections(bList, 4);
    aFlagSortIntAux(array, start, endP1, sections, sections.length - 1);
}

function aFlagSortIntAux(array, start, endP1, sections, sectionIndex) {
    let section = sections[sectionIndex];
    let bits = section.bits;
    let shift = section.shift;
    let mask = section.mask;
    let dRange = 1 << bits;
    let nextFree = Array(dRange).fill(0);
    for (let i = start; i < endP1; i++) {
        nextFree[(array[i] & mask) >> shift]++;
    }
    calculateSumOffsets(true, nextFree, dRange);
    let offsets = nextFree.slice();
    let curBlock = 0;
    while (curBlock < dRange) {
        let i = nextFree[curBlock] + start;
        if (i >= endP1 || ((curBlock + 1 < dRange) && i >= offsets[curBlock + 1] + start)) {
            curBlock = curBlock + 1;
            continue;
        }
        const elementHash = (array[i] & mask) >> shift;
        const elementIndex = nextFree[elementHash] + start;
        if (i !== elementIndex) {
            swap(array, i, elementIndex);
        }
        nextFree[elementHash]++;
    }
    if (sectionIndex > 0) {
        let N = endP1 - start;
        for (let i = 0; i < offsets.length; i++) {
            let start2 = offsets[i];
            let end2 = i + 1 < offsets.length ? offsets[i + 1] : N;
            if (end2 - start2 > 1) {
                aFlagSortIntAux(array, start2 + start, end2 + start, sections, sectionIndex - 1);
            }
        }
    }
}
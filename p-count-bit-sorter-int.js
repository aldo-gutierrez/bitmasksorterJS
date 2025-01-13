import {
    getMaskAsArray,
    getSections,
} from "./sorter-utils.js";
import {calculateMaskInt, partitionReverseNotStableUpperBit} from "./sorter-utils-int.js";

let COUNT_SORT_ERROR_SHOWED = false
const COUNT_SORT_ERROR = "Pigeonhole Count sort should be used for number range <= 2**24, for optimal performance: range <= 2**20"

export function pCountBitSorterInt(array, start, endP1, bList, bListStart) {
    if (!start) {
        start = 0;
    }
    if (!endP1) {
        endP1 = array.length;
    }
    if (!bList) {
        bList = getMaskAsArray(calculateMaskInt(array, start, endP1));
        bListStart = 0;
    }
    let N = endP1 - start
    let bListNew = bList.slice(bListStart);

    if (bListNew[0] === 31) { //there are negative numbers and positive numbers
        let finalLeft = partitionReverseNotStableUpperBit(array, start, endP1,);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) { //sort negative numbers
            pCountBitSorterInt(array, start, finalLeft);
        }
        if (n2 > 1) { //sort positive numbers
            pCountBitSorterInt(array, finalLeft, endP1);
        }
        return;
    }
    
    let sections = getSections(bListNew, 32);
    if (sections.length === 1) {
        let section = sections[0];
        let shift = section.shift;
        if (shift === 0) {
            let mask = section.mask;
            let elementSample = array[start];
            elementSample = elementSample & ~mask;
            if (elementSample === 0) { //last bits and includes all numbers and all positive numbers
                pCountSortPositive(array, start, endP1, 1 << section.bits);
            } else { //last bits but there is a mask for a bigger number
                pCountSortEndingMask(array, start, endP1, mask, elementSample);
            }
        } else {
            pCountSortSection(array, start, endP1, section);
        }
    } else if (sections.length > 1) {
        pCountSortSections(array, start, endP1, sections);
    }
}

//
// /**
//  * Pigeonhole count sort is destructive count sort as it reconstructs (rebuilds)
//  * the int numbers, no swaps, reverse or aux arrays.
//  * Faster sorter when the following conditions are met:
//  * when max-min (range <= 2**19 is faster than radixBitSorterInt)
//  * when max-min (range < 2**25 is faster than javascript sorter)
//  * when max-min (range = 2**25 has similar performance than javascript sorter)
//  * when max-min (range > 2**25 is slower than javascript sorter)
//  *    and when n (endP1-start) 2^17..2^20 (other ranges not tested yet)
//  */
export function pCountNoMaskSorterInt(array, start, endP1, min, max) {
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
    if (!min || !max) {
        min = array[start];
        max = array[start];
        for (let i = start + 1; i < endP1; i++) {
            let value = array[i];
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
    }
    let range = max - min + 1;
    validatePCountSortRange(range);
    if (!Number.isInteger(range)) {
        console.error("Pigeonhole Count sort only works on integers")
        return;
    }
    let count = new Array(range).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i] - min]++
    }
    let i = start;
    let j = min;
    for (; j <= max; j++) {
        let countJ = count[j - min];
        if (countJ > 0) {
            for (let c = 0; c < countJ; c++) {
                array[i] = j;
                i++;
            }
            if (i === endP1) {
                break;
            }
        }
    }
}


function pCountSortPositive(array, start, endP1, range) {
    validatePCountSortRange(range);
    let count = new Array(range).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i]]++
    }
    let i = start;
    let j = 0;
    for (; j <= count.length; j++) {
        let countJ = count[j];
        if (countJ > 0) {
            for (let c = 0; c < countJ; c++) {
                array[i] = j;
                i++;
            }
            if (i === endP1) {
                break;
            }
        }
    }
}

function pCountSortEndingMask(array, start, endP1, mask, elementSample) {
    let range = mask + 1;
    validatePCountSortRange(range);
    let count = new Array(range).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i] & mask]++
    }

    let i = start;
    let j = 0;
    for (; j <= count.length; j++) {
        let countJ = count[j];
        if (countJ > 0) {
            let value = j | elementSample;
            for (let c = 0; c < countJ; c++) {
                array[i] = value;
                i++;
            }
            if (i === endP1) {
                break;
            }
        }
    }
}

function pCountSortSection(array, start, endP1, section) {
    let range = 1 << section.bits;
    validatePCountSortRange(range);
    let count = new Array(range).fill(0);
    let number = new Array(range);
    let mask = section.mask;
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        let key = (element & mask) >> section.shift;
        count[key]++;
        number[key] = element;
    }

    let i = start;
    let j = 0;
    for (; j <= count.length; j++) {
        let countJ = count[j];
        if (countJ > 0) {
            let value = number[j];
            for (let c = 0; c < countJ; c++) {
                array[i] = value;
                i++;
            }
            if (i === endP1) {
                break;
            }
        }
    }
}

function pCountSortSections(array, start, endP1, sections) {
    let range = 1 << getSectionsBits(sections);
    validatePCountSortRange(range);
    let count = new Array(range).fill(0);
    let number = new Array(range);

    for (let i = start; i < endP1; i++) {
        let element = array[i];
        let key = getKeySN(element, sections);
        count[key]++;
        number[key] = element;
    }

    let i = start;
    let j = 0;
    for (; j <= count.length; j++) {
        let countJ = count[j];
        if (countJ > 0) {
            let value = number[j];
            for (let c = 0; c < countJ; c++) {
                array[i] = value;
                i++;
            }
            if (i === endP1) {
                break;
            }
        }
    }
}

/**
 * Maybe this could be useful when n is short compared to range, Maybe not as better algorithms are available
 */
function pCountSortSectionsSparse(array, start, endP1, sections) {
    let range = 1 << getSectionsBits(sections);
    validatePCountSortRange(range);
    let count = [];
    let number = [];

    for (let i = start; i < endP1; i++) {
        let element = array[i];
        let key = getKeySN(element, sections);
        count[key] = count[key] ? count[key] + 1 : 1;
        number[key] = element;
    }

    let i = start;
    count.forEach((countJ, j) => {
        let value = number[j];
        for (let c = 0; c < countJ; c++) {
            array[i] = value;
            i++;
        }
    })
}


export function getKeySN(element, sections) {
    let result = 0;
    const length = sections.length;
    for (let i = length - 1; i >= 0; i--) { //TODO CHECK THIS LINE, IN JAVA IMPLEMENTATION IS THE OPPOSITE DIRECTION
        let section = sections[i];
        let bits = (element & section.mask) >> section.shift;
        result = result << section.bits | bits;
    }
    return result;
}

export function getSectionsBits(sections) {
    let bits = 0;
    for (let s = 0; s < sections.length; s++) {
        let section = sections[s];
        bits += section.bits;
    }
    return bits;
}

export function validatePCountSortRange(range) {
    if (range > (1 << 24)) {
        if (!COUNT_SORT_ERROR_SHOWED) {
            console.error(COUNT_SORT_ERROR);
            COUNT_SORT_ERROR_SHOWED = true;
        }
    }
}

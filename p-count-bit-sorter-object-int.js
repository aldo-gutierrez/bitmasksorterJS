import {arrayCopy, getMaskAsArray, getSections} from "./sorter-utils.js";
import {calculateMaskInt} from "./sorter-utils-object-int.js";
import {validatePCountSortRange} from "./p-count-bit-sorter-int.js";

export function pCountSorterObjectInt(array, mapper, start, endP1, bList, bListStart) {
    if (!start) {
        start = 0;
    }
    if (!endP1) {
        endP1 = array.length;
    }
    if (!bList) {
        bList = getMaskAsArray(calculateMaskInt(array, start, endP1, mapper));
        bListStart = 0;
    }
    let bListNew = bList.slice(bListStart);
    let sections = getSections(bListNew, 32);
    if (sections.length === 1) {
        let section = sections[0];
        let shift = section.shift;
        if (shift === 0) {
            let mask = section.mask;
            let elementSample = mapper(array[start]);
            elementSample = elementSample & ~mask;
            if (elementSample === 0) { //last bits and includes all numbers and all positive numbers
                pCountSortPositive(array, mapper, start, endP1, 1 << section.bits);
            } else { //last bits but there is a mask for a bigger number
                pCountSortEndingMask(array, mapper, start, endP1, mask, elementSample);
            }
        } else {
            pCountSortSection(array, mapper, start, endP1, section);
        }
    } else if (sections.length > 1) {
        pCountSortSections(array, mapper, start, endP1, sections);
    }
}

function pCountSortPositive(array, mapper, start, endP1, range) {
    validatePCountSortRange(range);
    let count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        count[mapper(array[i])].push(array[i]);
    }
    let i = start;
    let j = 0;
    for (; j < count.length; j++) {
        let countJ = count[j];
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    }
}

function pCountSortEndingMask(array, mapper, start, endP1, mask, elementSample) {
    let range = mask + 1;
    validatePCountSortRange(range)
    let count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        count[mapper(array[i]) & mask].push(array[i]);
    }
    let i = start;
    let j = 0;
    for (; j < count.length; j++) {
        let countJ = count[j];
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    }
}

function pCountSortSection(array, mapper, start, endP1, section) {
    let range = 1 << section.bits;
    validatePCountSortRange(range)
    let count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        count[(mapper(array[i]) & mask) >> section.shift].push(array[i]);
    }
    let i = start;
    let j = 0;
    for (; j < count.length; j++) {
        let countJ = count[j];
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    }
}

function pCountSortSections(array, mapper, start, endP1, sections) {
    let bits = 0;
    for (let s = 0; s < sections.length; s++) {
        let section = sections[s];
        bits += section.bits;
    }
    let range = 1 << bits;
    validatePCountSortRange(range)
    let count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        let element = array[i];
        let key = getKeySN(mapper(element), sections);
        count[key].push(element);
    }
    let i = start;
    let j = 0;
    for (; j <= count.length; j++) {
        let countJ = count[j];
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    }
}


import {arrayCopy, getMaskAsArray, getSections} from "./sorter-utils.js";
import {calculateMaskInt} from "./sorter-utils-object-int.js";
import {getKeySN, getSectionsBits, validatePCountSortRange} from "./p-count-bit-sorter-int.js";

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
    let N = endP1 - start
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
                const range = 1 << section.bits;
                if (range >= N) {
                    pCountSortPositiveV2(array, mapper, start, endP1, range);
                } else {
                    pCountSortPositiveV1(array, mapper, start, endP1, range);
                }
            } else { //last bits but there is a mask for a bigger number
                const range = mask + 1;
                if (range >= N) {
                    pCountSortEndingMaskV2(array, mapper, start, endP1, mask);
                } else {
                    pCountSortEndingMaskV1(array, mapper, start, endP1, mask);
                }
            }
        } else {
            let range = 1 << section.bits;
            if (range >= N) {
                pCountSortSectionV2(array, mapper, start, endP1, section);
            } else {
                pCountSortSectionV1(array, mapper, start, endP1, section);
            }
        }
    } else if (sections.length > 1) {
        const range = 1 << getSectionsBits(sections);
        if (range >= N) {
            pCountSortSectionsV2(array, mapper, start, endP1, sections);
        } else {
            pCountSortSectionsV1(array, mapper, start, endP1, sections);
        }
    }
}

function pCountSortPositiveV1(array, mapper, start, endP1, range) {
    validatePCountSortRange(range);
    const count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        count[mapper(element)].push(element);
    }
    let i = start;
    let j = 0;
    for (; j < count.length; j++) {
        let countJ = count[j];
        if (countJ.length > 0) {
            arrayCopy(countJ, 0, array, i, countJ.length);
            i += countJ.length;
        }
    }
}

function pCountSortPositiveV2(array, mapper, start, endP1, range) {
    validatePCountSortRange(range);
    const count = new Array(range);
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        const key = mapper(element);
        let aux = count[key];
        if (!aux) {
            aux = []
            count[key] = aux;
        }
        aux.push(element);
    }
    let i = start;
    count.forEach((countJ, j) => {
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    })
}

function pCountSortEndingMaskV1(array, mapper, start, endP1, mask) {
    const range = mask + 1;
    validatePCountSortRange(range)
    const count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        count[mapper(element) & mask].push(element);
    }
    let i = start;
    let j = 0;
    for (; j < count.length; j++) {
        let countJ = count[j];
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    }
}

function pCountSortEndingMaskV2(array, mapper, start, endP1, mask) {
    const range = mask + 1;
    validatePCountSortRange(range);
    const count = new Array(range);
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        const key = mapper(element) & mask;
        let aux = count[key];
        if (!aux) {
            aux = []
            count[key] = aux;
        }
        aux.push(element);
    }
    let i = start;
    count.forEach((countJ, j) => {
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    })
}

function pCountSortSectionV1(array, mapper, start, endP1, section) {
    const range = 1 << section.bits;
    validatePCountSortRange(range)
    const count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        count[(mapper(element) & section.mask) >> section.shift].push(element);
    }
    let i = start;
    let j = 0;
    for (; j < count.length; j++) {
        let countJ = count[j];
        if (countJ.length > 0) {
            arrayCopy(countJ, 0, array, i, countJ.length);
            i += countJ.length;
        }
    }
}

function pCountSortSectionV2(array, mapper, start, endP1, section) {
    const range = 1 << section.bits;
    validatePCountSortRange(range);
    const count = new Array(range);
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        const key = (mapper(element) & section.mask) >> section.shift;
        let aux = count[key];
        if (!aux) {
            aux = []
            count[key] = aux;
        }
        aux.push(element);
    }
    let i = start;
    count.forEach((countJ, j) => {
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    })
}

function pCountSortSectionsV1(array, mapper, start, endP1, sections) {
    const range = 1 << getSectionsBits(sections);
    validatePCountSortRange(range)
    const count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        const key = getKeySN(mapper(element), sections);
        count[key].push(element);
    }
    let i = start;
    let j = 0;
    for (; j < count.length; j++) {
        let countJ = count[j];
        if (countJ.length > 0) {
            arrayCopy(countJ, 0, array, i, countJ.length);
            i += countJ.length;
        }
    }
}

function pCountSortSectionsV2(array, mapper, start, endP1, sections) {
    const range = 1 << getSectionsBits(sections);
    validatePCountSortRange(range)
    const count = new Array(range);
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        const key = getKeySN(mapper(element), sections);
        let aux = count[key];
        if (!aux) {
            aux = []
            count[key] = aux;
        }
        aux.push(element);
    }
    let i = start;
    count.forEach((countJ, j) => {
        arrayCopy(countJ, 0, array, i, countJ.length);
        i += countJ.length;
    })
}
import {arrayCopy, getMaskAsArray, getSections} from "./sorter-utils.js";
import {
    calculateMaskInt,
    partitionReverseStableInt,
    partitionReverseStableLowMemInt
} from "./sorter-utils-object-int.js";
import {getKeySN, getSectionsBits, validatePCountSortRange} from "./p-count-bit-sorter-int.js";

export function pCountBitSorterObjectInt(array, mapper, start, endP1, bList, bListStart) {
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
    if (bListNew.length === 0) {
        return;
    }

    if (bListNew[0] === 31) { //there are negative numbers and positive numbers
        let aux = Array(endP1 - start);
        //let finalLeft =partitionReverseStableLowMemInt(array, start, endP1, 1 << 31, mapper, aux);
        let finalLeft =partitionReverseStableInt(array, start, endP1, 1 << 31, aux, mapper);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) { //sort negative numbers
            pCountBitSorterObjectInt(array, mapper, start, finalLeft);
        }
        if (n2 > 1) { //sort positive numbers
            pCountBitSorterObjectInt(array, mapper, finalLeft, endP1);
        }
        return;
    }

    const maxBitDigitsOnePass = 16;
    let sections = getSections(bListNew, maxBitDigitsOnePass);

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
        sections = getSections(bListNew, 8);
        const range = 1 << getSectionsBits(sections);
        if (range <= 1 << maxBitDigitsOnePass) {
            if (range >= N) {
                pCountSortSectionsV2(array, mapper, start, endP1, sections);
            } else {
                pCountSortSectionsV1(array, mapper, start, endP1, sections);
            }
        } else {
            let section = sections[sections.length - 1];
            let range = 1 << section.bits;
            if (range >= N) {
                pCountSortSectionV2(array, mapper, start, endP1, section, (arrayX, mapperX, startX, endX) => {
                    if (endX - startX > 1) {
                        pCountBitSorterObjectInt(arrayX, mapperX, startX, endX);
                    }
                });
            } else {
                pCountSortSectionV1(array, mapper, start, endP1, section, (arrayX, mapperX, startX, endX) => {
                    if (endX - startX > 1) {
                        pCountBitSorterObjectInt(arrayX, mapperX, startX, endX);
                    }
                });
            }
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

function pCountSortSectionV1(array, mapper, start, endP1, section, f) {
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
            if (f) {
                f(array, mapper, i, i + countJ.length);
            }
            i += countJ.length;
        }
    }
}

function pCountSortSectionV2(array, mapper, start, endP1, section, f) {
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
        if (f) {
            f(array, mapper, i, i + countJ.length);
        }
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
import {
    arrayCopy,
    getMaskAsArray,
    getSections,
    getSortOptions,
    handleNullsUndefinedAndNans,
    validateSortRange
} from "../utils/sorter-utils.js";
import {
    calculateMaskInt,
    partitionReverseStableInt,
    partitionReverseStableLowMemInt, partitionStableInt
} from "../utils/sorter-utils-object-int.js";
import { getKeySN, getSectionsBits, validatePCountSortRange } from "./p-count-bit-sorter-int.js";

export function pCountSortObjectByInt32Key(array, mapper, options = {}) {
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1, mapper));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let bList = options.bList;
    let bListStart = options.bListStart;
    if (!bList) {
        bList = getMaskAsArray(calculateMaskInt(array, start, endP1, mapper));
        bListStart = 0;
    }
    let N = endP1 - start
    let bListNew = bList.slice(bListStart);

    if (bListNew[0] === 31) { //there are negative numbers and positive numbers
        let aux = Array(endP1 - start);
        let finalLeft = asc ? partitionReverseStableInt(array, start, endP1, 1 << 31, aux, mapper)
            : partitionStableInt(array, start, endP1, 1 << 31, aux, mapper);
        let n1 = finalLeft - start;
        let n2 = endP1 - finalLeft;
        if (n1 > 1) { //sort negative numbers
            pCountSortObjectByInt32Key(array, mapper, { start, end: finalLeft });
        }
        if (n2 > 1) { //sort positive numbers
            pCountSortObjectByInt32Key(array, mapper, { start: finalLeft, end: endP1 });
        }
        return;
    }

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
                    pCountSortPositiveV2(asc, array, mapper, start, endP1, range);
                } else {
                    pCountSortPositiveV1(asc, array, mapper, start, endP1, range);
                }
            } else { //last bits but there is a mask for a bigger number
                const range = mask + 1;
                if (range >= N) {
                    pCountSortEndingMaskV2(asc, array, mapper, start, endP1, mask);
                } else {
                    pCountSortEndingMaskV1(asc, array, mapper, start, endP1, mask);
                }
            }
        } else {
            let range = 1 << section.bits;
            if (range >= N) {
                pCountSortSectionV2(asc, array, mapper, start, endP1, section);
            } else {
                pCountSortSectionV1(asc, array, mapper, start, endP1, section);
            }
        }
    } else if (sections.length > 1) {
        const range = 1 << getSectionsBits(sections);
        if (range >= N) {
            pCountSortSectionsV2(asc, array, mapper, start, endP1, sections);
        } else {
            pCountSortSectionsV1(asc, array, mapper, start, endP1, sections);
        }
    }
}

function pCountSortPositiveV1(asc, array, mapper, start, endP1, range) {
    validatePCountSortRange(range);
    const count = new Array(range)
    for (let i = 0; i < range; i++) {
        count[i] = [];
    }
    for (let i = start; i < endP1; i++) {
        const element = array[i];
        count[mapper(element)].push(element);
    }
    copyCountBucketsToArray(asc, start, count, array);
}

function pCountSortPositiveV2(asc, array, mapper, start, endP1, range) {
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
    copyCountBucketsToArray(asc, start, count, array);
}

function pCountSortEndingMaskV1(asc, array, mapper, start, endP1, mask) {
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
    copyCountBucketsToArray(asc, start, count, array);
}

function pCountSortEndingMaskV2(asc, array, mapper, start, endP1, mask) {
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
    copyCountBucketsToArray(asc, start, count, array);
}

function pCountSortSectionV1(asc, array, mapper, start, endP1, section) {
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
    copyCountBucketsToArray(asc, start, count, array);
}

function pCountSortSectionV2(asc, array, mapper, start, endP1, section) {
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
    copyCountBucketsToArray(asc, start, count, array);
}

function pCountSortSectionsV1(asc, array, mapper, start, endP1, sections) {
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
    copyCountBucketsToArray(asc, start, count, array);
}

function pCountSortSectionsV2(asc, array, mapper, start, endP1, sections) {
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
    copyCountBucketsToArray(asc, start, count, array);
}

function copyCountBucketsToArray(asc, start, count, array) {
    let i = start;
    if (asc) {
        for (let j = 0; j < count.length; j++) {
            const bucket = count[j];
            if (bucket?.length) {
                arrayCopy(bucket, 0, array, i, bucket.length);
                i += bucket.length;
            }
        }
    } else {
        for (let j = count.length - 1; j >= 0; j--) {
            const bucket = count[j];
            if (bucket?.length) {
                arrayCopy(bucket, 0, array, i, bucket.length);
                i += bucket.length;
            }
        }
    }
}
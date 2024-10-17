import {arrayCopy} from "./sorter-utils.js";

export function partitionStableInt(array, start, endP1, mask, aux, mapper) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        if ((element & mask) === 0) {
            array[left] = array[i];
            left++;
        } else {
            aux[right] = array[i];
            right++;
        }
    }
    arrayCopy(aux, 0, array, left, right);
    return left;
}

export function partitionReverseStableInt(array, start, endP1, mask, aux, mapper) {
    let left = start;
    let right = 0;
    for (let i = start; i < endP1; i++) {
        let element = mapper(array[i]);
        if (!((element & mask) === 0)) {
            array[left] = array[i];
            left++;
        } else {
            aux[right] = array[i];
            right++;
        }
    }
    arrayCopy(aux, 0, array, left, right);
    return left;
}

export function calculateMaskInt(array, start, endP1, mapper) {
    let mask = 0x00000000;
    let inv_mask = 0x00000000;
    for (let i = start; i < endP1; i++) {
        let ei = mapper(array[i]);
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
}
import {swap} from "./sorter-utils.js";

export function calculateMaskInt(array, start, endP1) {
    let mask = 0x00000000;
    let inv_mask = 0x00000000;
    for (let i = start; i < endP1; i++) {
        let ei = array[i];
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
}

export function partitionReverseNotStableUpperBit(array, start, endP1) {
    let left = start;
    let right = endP1 - 1;

    while (left <= right) {
        let element = array[left];
        if (element >= 0) {
            while (left <= right) {
                element = array[right];
                if (element >= 0) {
                    right--;
                } else {
                    swap(array, left, right);
                    left++;
                    right--;
                    break;
                }
            }
        } else {
            left++;
        }
    }
    return left;
}

export function partitionNotStable(array, start, endP1, mask) {
    let left = start;
    let right = endP1 - 1;

    while (left <= right) {
        let element = array[left];
        if ((element & mask) === 0) {
            left++;
        } else {
            while (left <= right) {
                element = array[right];
                if ((element & mask) === 0) {
                    swap(array, left, right);
                    left++;
                    right--;
                    break;
                } else {
                    right--;
                }
            }
        }
    }
    return left;
}
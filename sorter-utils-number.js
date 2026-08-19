import {getMaskAsArray, swap} from "./sorter-utils.js";

export function calculateMaskNumber(array, start, endP1) {
    let pMask0 = 0;
    let invMask0 = 0;
    let pMask1 = 0;
    let invMask1 = 0;
    for (let i = start; i < endP1; ++i) {
        let im2 = i * 2;
        let ei0 = array[im2];
        let ei1 = array[im2 + 1];
        pMask0 = pMask0 | ei0;
        invMask0 = invMask0 | (~ei0);
        pMask1 = pMask1 | ei1;
        invMask1 = invMask1 | (~ei1);
    }
    return [pMask0 & invMask0, pMask1 & invMask1]
}

export function getMaskAsArrayNumber(masks) {
    return [getMaskAsArray(masks[0]), getMaskAsArray(masks[1])];
}

export function partitionReverseF64NotStableUpperBit(arrayf64, arrayf32, start, endP1) {
    let left = start;
    let right = endP1 - 1;

    while (left <= right) {
        let element = arrayf32[left * 2 + 1];
        if (element >= 0) {
            while (left <= right) {
                element = arrayf32[right * 2 + 1];
                if (element >= 0) {
                    right--;
                } else {
                    swap(arrayf64, left, right);
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
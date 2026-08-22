import {swap} from "./sorter-utils.js";

export function calculateMaskIntOld(array, start, endP1) {
    let mask = 0x00000000;
    let inv_mask = 0x00000000;
    for (let i = start; i < endP1; i++) {
        let ei = array[i];
        mask = mask | ei;
        inv_mask = inv_mask | (~ei);
    }
    return mask & inv_mask;
}

export function calculateMaskIntNew(array, start, endP1) {
    let or_mask = 0;
    let and_mask = ~0;
    for (let i = start; i < endP1; i++) {
        const ei = array[i];
        or_mask |= ei;
        and_mask &= ei;
    }
    return or_mask & ~and_mask;
}

/**
 * Optimized version of calculateMaskInt with early exit checks and loop unrolling.
 */
export function calculateMaskInt(array, start, endP1, exitMask) {
    // Fallback for default parameter
    if (exitMask === undefined) {
        exitMask = ~0;
    }

    let or_mask = 0;
    let and_mask = ~0;

    let i = start;
    let length = endP1 - start;

    // Unsigned right shift is vastly faster than Math.floor(length / 1024)
    let numBlocks = length >>> 10;

    // 1. Process in blocks of 1024
    for (let b = 0; b < numBlocks; b++) {
        let blockEnd = i + 1024;

        // Inner loop: unrolled by 4 (executes 256 times per block)
        for (; i < blockEnd; i += 4) {
            let e1 = array[i];
            let e2 = array[i + 1];
            let e3 = array[i + 2];
            let e4 = array[i + 3];

            or_mask |= (e1 | e2) | (e3 | e4);
            and_mask &= (e1 & e2) & (e3 & e4);
        }

        // Early exit check ONLY at the end of the 1024 block
        const mask = or_mask & ~and_mask;
        if ((mask & exitMask) === exitMask) {
            //return exitMask;
            return mask;
        }
    }

    // 2. Handle remaining elements (can still unroll by 4 for speed)
    let remainEnd = endP1 - 4;
    for (; i <= remainEnd; i += 4) {
        let e1 = array[i];
        let e2 = array[i + 1];
        let e3 = array[i + 2];
        let e4 = array[i + 3];

        or_mask |= (e1 | e2) | (e3 | e4);
        and_mask &= (e1 & e2) & (e3 & e4);
    }

    // 3. Final tail elements (0 to 3 elements left) - no early checks
    for (; i < endP1; i++) {
        let ei = array[i];
        or_mask |= ei;
        and_mask &= ei;
    }
    return or_mask & ~and_mask;
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
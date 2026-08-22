import {getMaskAsArray, swap} from "./sorter-utils.js";

export function calculateMaskNumberOld(array, start, endP1) {
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

export function calculateMaskNumberNew(array, start, endP1) {
    let or_mask_0 = 0;
    let and_mask_0 = ~0; // ~0 evaluates to -1, but strongly signals a 32-bit int to the JIT
    let or_mask_1 = 0;
    let and_mask_1 = ~0;
    for (let i = start; i < endP1; ++i) {
        // Bitwise shift is sometimes faster than multiplication for index calc
        let im2 = i << 1;

        // 1. Group Memory Reads
        let ei0 = array[im2];
        let ei1 = array[im2 + 1];

        // 2. Interleave Independent Operations
        // Spacing out the operations on ei0 and ei1 allows the CPU
        // to execute these instructions concurrently on different execution ports.
        or_mask_0 = or_mask_0 | ei0;
        or_mask_1 = or_mask_1 | ei1;

        and_mask_0 = and_mask_0 & ei0;
        and_mask_1 = and_mask_1 & ei1;
    }
    const mask0 = or_mask_0 & ~and_mask_0;
    const mask1 = or_mask_1 & ~and_mask_1;
    return [mask0, mask1];
}


/**
 * Optimized version of calculateMaskInt with early exit checks.
 */
export function calculateMaskNumber(array, start, endP1, exitMask_0, exitMask_1) {
    // Fallback for default parameter
    if (exitMask_0 === undefined) {
        exitMask_0 = -1;
    }
    if (exitMask_1 === undefined) {
        exitMask_1 = -1;
    }

    let or_mask_0 = 0;
    let and_mask_0 = ~0;
    let or_mask_1 = 0;
    let and_mask_1 = ~0;

    let i = start;

    // Process until we reach the end
    while (i < endP1) {
        // Calculate the end of the current block (max 1024 elements, or the end of the array)
        let blockEnd = i + 1024;
        if (blockEnd > endP1) {
            blockEnd = endP1;
        }

        // Let V8 do what it does best: a simple, highly predictable loop
        for (; i < blockEnd; ++i) {
            let im2 = i * 2;
            let ei0 = array[im2];
            let ei1 = array[im2 + 1];

            or_mask_0 = or_mask_0 | ei0;
            or_mask_1 = or_mask_1 | ei1;

            and_mask_0 = and_mask_0 & ei0;
            and_mask_1 = and_mask_1 & ei1;
        }

        // Early exit check ONLY at the block boundaries
        const mask0 = or_mask_0 & ~and_mask_0;
        const mask1 = or_mask_1 & ~and_mask_1;
        if ((mask0 & exitMask_0) === exitMask_0 && (mask1 & exitMask_1) === exitMask_1) {
            return [mask0, mask1];
        }
    }
    const mask0 = or_mask_0 & ~and_mask_0;
    const mask1 = or_mask_1 & ~and_mask_1;
    return [mask0, mask1];
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
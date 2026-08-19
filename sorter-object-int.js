import { radixBitSorterObjectIntV2 } from "./radix-bit-sorter-object-int-v2.js";
import { radixBitSorterObjectInt } from "./radix-bit-sorter-object-int.js";

//TODO choose algorithm not only by N, but also by Range
export function sortObjectInt(array, mapper, start, endP1) {
    if (!start) {
        start = 0;
    }
    if (endP1 === undefined) {
        endP1 = array.length;
    }
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    if (n >= 32768) {
        radixBitSorterObjectIntV2(array, mapper, start, endP1);
    } else if (n >= 512) {
        radixBitSorterObjectInt(array, mapper, start, endP1);
    } else {
        // 1. Extract the subarray from index `start` to `endP1` (exclusive)
        const sortedSub = array.slice(start, endP1).sort(function (a, b) {
            return mapper(a) - mapper(b);
        });
        // 2. Replace the original section with the sorted elements
        array.splice(start, sortedSub.length, ...sortedSub);
    }
}
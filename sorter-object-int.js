import {radixBitSorterObjectIntV2} from "./radix-bit-sorter-object-int-v2.js";
import {radixBitSorterObjectInt} from "./radix-bit-sorter-object-int.js";

//TODO choose algorithm not only by N, but also by Range
export function sortObjectInt(array, mapper, start, endP1) {
    if (!start) {
        start = 0;
    }
    if (!endP1) {
        endP1 = array.length;
    }
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    if (n >= 32678) {
        radixBitSorterObjectIntV2(array, mapper, start, endP1);
    } else if (n >= 512) {
        radixBitSorterObjectInt(array, mapper, start, endP1);
    } else {
        array.sort(function (a, b) {
            return a.id - b.id;
        });
    }
}
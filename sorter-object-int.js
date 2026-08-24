import {radixBitSorterObjectIntV2} from "./radix-bit-sorter-object-int-v2.js";
import { radixBitSorterObjectInt } from "./radix-bit-sorter-object-int.js";
import { validateSortRange } from "./sorter-utils.js";

//TODO choose algorithm not only by N, but also by Range
export function sortObjectInt(array, mapper, options) {
    let { start, endP1 } = { start: undefined, endP1: undefined };
    if (options && typeof options === 'object' && !Array.isArray(options)) {
        start = options.start;
        endP1 = options.end;
    }
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    if (n >= 32768) {
        radixBitSorterObjectIntV2(array, mapper, { start, end: endP1 });
    } else if (n >= 512) {
        radixBitSorterObjectInt(array, mapper, { start, end: endP1 });
    } else {
        const sortedSub = array.slice(start, endP1).sort(function (a, b) {
            return mapper(a) - mapper(b);
        });
        array.splice(start, sortedSub.length, ...sortedSub);
    }
}
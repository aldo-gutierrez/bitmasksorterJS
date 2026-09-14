import {radixBitSortInt32} from "../algorithms/radix-bit-sorter-int.js";
import {pCountBitSortInt32} from "../algorithms/p-count-bit-sorter-int.js";

export function sortInt32(array, options) {
    let newOptions = options || {};
    if (options.type === 'int32') {
        radixBitSortInt32(array, options);
    } else {
        pCountBitSortInt32(array, newOptions);
    }
}
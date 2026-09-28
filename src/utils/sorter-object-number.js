import {radixBitSortObjectByFloat64Key} from "../algorithms/radix-bit-sorter-object-number.js";

export function sortObjectByFloat64Key(arrayObj, mapper, options = {}) {
    options.runtime = options.runtime || {};
    return radixBitSortObjectByFloat64Key(arrayObj, mapper, options);
}
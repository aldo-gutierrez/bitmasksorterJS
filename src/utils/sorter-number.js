import { radixBitSortFloat64 } from "../algorithms/radix-bit-sorter-number.js";

export function sortFloat64(array, options) {
    options = options ? {...options} : {};
    options.runtime = {};
    radixBitSortFloat64(array, options);
}
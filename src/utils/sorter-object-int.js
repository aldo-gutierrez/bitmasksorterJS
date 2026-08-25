import {radixBitV2SortObjectByInt32Key} from "../algorithms/radix-bit-v2-sorter-object-int.js";
import { radixBitSortObjectByInt32Key } from "../algorithms/radix-bit-sorter-object-int.js";
import {getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "./sorter-utils.js";

//TODO choose algorithm not only by N, but also by Range
export function sortObjectByInt32Key(array, mapper, options) {
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    if (options) {
        options.start = start;
        options.end = endP1;
        options.order = asc ? "ASC" : "DESC";
        options.nulls = "ignore";
        options.undefineds = "ignore";
        options.nans = "ignore";
    }
    if (n >= 32768) {
        radixBitV2SortObjectByInt32Key(array, mapper, options);
    } else if (n >= 512) {
        radixBitSortObjectByInt32Key(array, mapper, options);
    } else {
        const sortedSub = asc ? array.slice(start, endP1).sort(function (a, b) {
            return mapper(a) - mapper(b);
        }) : array.slice(start, endP1).sort(function (a, b) {
            return mapper(b) - mapper(a);
        });
        array.splice(start, sortedSub.length, ...sortedSub);
    }
}
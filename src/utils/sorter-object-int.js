import {radixBitV2SortObjectByInt32Key} from "../algorithms/radix-bit-v2-sorter-object-int.js";
import { radixBitSortObjectByInt32Key } from "../algorithms/radix-bit-sorter-object-int.js";
import {getMaskAsArray, getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "./sorter-utils.js";
import {getComparatorObjectInt32, sortSubList} from "../algorithms/native-sorter.js";
import {isTypedArray} from "./utils.js";
import {pCountSortObjectByInt32Key, quickBitSortObjectByInt32Key} from "../main.js";
import {calculateMaskInt} from "./sorter-utils-object-int.js";

export let sorterMapObjectInt32 =
[
    //2
    [ "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N" ],
    //4
    [ "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N" ],
    //8
    [ "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N" ],
    //16
    [ "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "Q", "N", "Q", "N", "N", "N", "N", "N", "N", "N", "N", "N" ],
    //32
    [ "Q", "Q", "Q", "X", "Q", "N", "N", "Q", "Q", "N", "N", "N", "Q", "N", "Q", "N", "N", "Q", "N", "N", "N", "N", "Q", "N" ],
    //64
    [ "Q", "Q", "Q", "Q", "P", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q" ],
    //128
    [ "Q", "Q", "Q", "X", "P", "P", "P", "P", "P", "P", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q" ],
    //256
    [ "Q", "Q", "P", "X", "P", "P", "P", "P", "X", "P", "X", "R", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "Q", "R" ],
    //512
    [ "Q", "P", "P", "P", "P", "P", "P", "P", "X", "X", "X", "X", "R", "X", "R", "X", "X", "X", "X", "X", "R", "X", "X", "X" ],
    //1024
    [ "X", "X", "X", "P", "P", "P", "P", "P", "X", "X", "X", "X", "X", "X", "X", "X", "R", "X", "R", "X", "R", "R", "R", "X" ],
    //2048
    [ "Q", "Q", "X", "P", "P", "P", "P", "P", "P", "X", "X", "X", "X", "X", "X", "R", "X", "X", "X", "R", "X", "R", "R", "R" ],
    //4096
    [ "Q", "X", "X", "X", "P", "P", "P", "P", "X", "X", "X", "X", "R", "X", "R", "X", "R", "R", "R", "R", "X", "X", "R", "R" ],
    //8192
    [ "Q", "P", "P", "P", "P", "P", "P", "P", "P", "X", "X", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "X", "R", "R" ],
    //16384
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //32768
    [ "Q", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //65536
    [ "Q", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //131072
    [ "Q", "P", "P", "P", "P", "P", "R", "P", "P", "R", "R", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //262144
    [ "Q", "X", "P", "X", "R", "P", "R", "R", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //524288
    [ "Q", "X", "X", "X", "X", "P", "X", "X", "X", "X", "X", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //1048576
    [ "Q", "R", "R", "X", "X", "X", "X", "X", "X", "X", "X", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //2097152
    [ "Q", "X", "R", "X", "X", "X", "X", "X", "X", "X", "X", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //4194304
    [ "Q", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //8388608
    [ "Q", "R", "R", "X", "X", "X", "X", "X", "X", "X", "X", "R", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //16777216
    [ "Q", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ]
]

//Choose algorithm not only by N, but also by Range
export function sortObjectByInt32Key(array, mapper, options = {}) {
    options.runtime = options.runtime || {};
    let { start, endP1, asc, nulls } = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1, mapper));
    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let mask = calculateMaskInt(array, start, endP1, mapper);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }
    options.start = start;
    options.end = endP1;
    options.order = asc ? "asc" : "desc";
    options.runtime.mask = mask;
    options.nulls = "ignore";

    let log2RangeM1 = bList.length - 1; //Log2(K)
    let log2SizeM1 = Math.ceil(Math.log2(n)) - 1; //Log2(N)
    let log2RangeM1Padded = bList[0] - bList[bList.length - 1] - 1;

    let sorter;
    if (n <= 16) {
        sorter = "N"
    } else {
        if (log2RangeM1 <= 23 && log2SizeM1 <= 23) {
            sorter = sorterMapObjectInt32[log2SizeM1][log2RangeM1];
        } else {
            if (log2RangeM1Padded > 11) {
                sorter = "R";
            } else {
                sorter = "X";
            }
        }
    }
    executeSorterObjectInt32Key(sorter, asc, array, start, endP1, mapper, options);
}



function executeSorterObjectInt32Key(sorter, asc, array, start, endP1, mapper, options) {
    if (sorter === "Q") {
        quickBitSortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "P") {
        pCountSortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "R") {
        radixBitV2SortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "X") {
        radixBitSortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "N") {
        options.nulls = "ignore";
        let comparator = getComparatorObjectInt32(asc, options.nulls, mapper);
        sortSubList(array, start, endP1, comparator, false);
    } else {
        console.error("sortInt32: invalid sorter type: " + sorter);
    }
}
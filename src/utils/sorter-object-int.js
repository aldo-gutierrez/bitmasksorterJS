import {radixBitV2SortObjectByInt32Key} from "../algorithms/radix-bit-v2-sorter-object-int.js";
import { radixBitSortObjectByInt32Key } from "../algorithms/radix-bit-sorter-object-int.js";
import {getMaskAsArray, getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "./sorter-utils.js";
import {sortSubList} from "../algorithms/native-sorter.js";
import {isTypedArray} from "./utils.js";
import {pCountSortObjectByInt32Key, quickBitSortObjectByInt32Key} from "../main.js";
import {calculateMaskInt} from "./sorter-utils-object-int.js";

let sortMap =
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
export function sortObjectByInt32Key(array, mapper, options) {
    options = options || {};
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
    options.mask = mask;

    let log2Range = bList.length - 1; //Log2(K)
    let log2Size = Math.ceil(Math.log2(n)) - 1; //Log2(N)
    let log2RangePadded = bList[0] - bList[bList.length - 1] - 1;

    let sorter;
    if (n <= 16) {
        sorter = "N"
    } else {
        if (log2Range <= 23 && log2Size <= 23) {
            sorter = sortMap[log2Size][log2Range];
        } else {
            if (log2RangePadded > 11) {
                sorter = "R";
            } else {
                sorter = "X";
            }
        }
    }
    if (sorter === "Q") {
        quickBitSortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "P") {
        pCountSortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "R") {
        radixBitV2SortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "X") {
        radixBitSortObjectByInt32Key(array, mapper, options);
    } else if (sorter === "N") {
        let comparator;
        if (options.nulls === "ignore") {
            comparator = asc ? (a, b) => mapper(a) - mapper(b) : (a, b) => mapper(b) - mapper(a);
        } else {
            let nullsFirst = options.nulls === "first";
            comparator = (a, b) => {
                const aKey = mapper(a);
                const bKey = mapper(b);

                const aUndefined = aKey === undefined;
                const bUndefined = bKey === undefined;

                if (aUndefined || bUndefined) {
                    if (aUndefined && bUndefined) return 0;
                    return aUndefined ? 1 : -1;
                }

                const aNull = aKey === null || Number.isNaN(aKey);
                const bNull = bKey === null || Number.isNaN(bKey);

                if (aNull || bNull) {
                    if (aNull && bNull) return 0;
                    return aNull === nullsFirst ? -1 : 1;
                }

                return asc ? aKey - bKey : bKey - aKey;
            };
        }
        sortSubList(array, start, endP1, comparator, isTypedArray(array));
    } else {
        console.error("sortInt32: invalid sorter type: " + sorter);
    }
}
import {radixBitSortInt32} from "../algorithms/radix-bit-sorter-int.js";
import {pCountBitSortInt32} from "../algorithms/p-count-bit-sorter-int.js";
import {getMaskAsArray, getSortOptions, handleNullsUndefinedAndNans, validateSortRange} from "./sorter-utils.js";
import {quickBitSortInt32} from "../main.js";
import {calculateMaskInt} from "./sorter-utils-int.js";
import {sortSubList} from "../algorithms/native-sorter.js";
import {isTypedArray} from "./utils.js";

let sortMap =
[
    //2
    [ "N", "N", "N", "N", "N", "N", "N", "N", "N", "Q", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N" ],
    //4
    [ "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N" ],
    //8
    [ "N", "N", "N", "Q", "Q", "N", "N", "Q", "Q", "N", "N", "N", "N", "N", "Q", "N", "Q", "N", "N", "Q", "N", "N", "N", "N" ],
    //16
    [ "N", "Q", "Q", "N", "N", "N", "Q", "Q", "N", "N", "N", "N", "N", "N", "N", "Q", "N", "N", "N", "N", "N", "Q", "N", "Q" ],
    //32
    [ "Q", "Q", "Q", "P", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "N", "Q", "N", "Q", "Q", "Q", "Q", "Q", "Q" ],
    //64
    [ "Q", "P", "P", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q" ],
    //128
    [ "Q", "Q", "P", "P", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q" ],
    //256
    [ "Q", "Q", "Q", "P", "Q", "Q", "Q", "P", "P", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q" ],
    //512
    [ "Q", "P", "P", "P", "Q", "Q", "Q", "P", "P", "P", "P", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q", "Q" ],
    //1024
    [ "Q", "Q", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //2048
    [ "Q", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //4096
    [ "Q", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //8192
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //16384
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R", "R" ],
    //32768
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R" ],
    //65536
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R", "R" ],
    //131072
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R", "R" ],
    //262144
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R" ],
    //524288
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R", "R" ],
    //1048576
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R" ],
    //2097152
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R", "R" ],
    //4194304
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R", "R", "R" ],
    //8388608
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "R" ],
    //16777216
    [ "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P", "P" ]
];

export function sortInt32(array, options) {
    options = options || {};
    let {start, endP1, asc, nulls} = getSortOptions(options);
    ({ start, endP1 } = validateSortRange(array, start, endP1));
    ({start, endP1} = handleNullsUndefinedAndNans(array, nulls, start, endP1));

    let n = endP1 - start;
    if (n < 2) {
        return;
    }
    let mask = calculateMaskInt(array, start, endP1);
    let bList = getMaskAsArray(mask);
    if (bList.length === 0) {
        return;
    }
    options.start = start;
    options.end = endP1;
    options.order = asc ? "asc" : "desc";
    options.nulls = "ignore";
    options.nans = "ignore";
    options.mask = mask;

    let log2Range = bList.length - 1; //Log2(K)
    let log2Size = Math.ceil(Math.log2(n)) - 1; //Log2(N)
    let log2RangePadded = bList[0] - bList[bList.length - 1] - 1;

    let sorter;
    if (n <= 16) {
        sorter = "N";
    } else if (n <= 512) {
        sorter = "Q";
    } else {
        if (log2Range <= 23 && log2Size <= 23) {
            sorter = sortMap[log2Size][log2Range];
        } else {
            if (log2Range >= 24) {
                sorter = "R";
            } else {
                if (log2Size > log2RangePadded) {
                    sorter = "P"
                } else {
                    sorter = "R"
                }
            }
        }
    }
    if (sorter === "Q") {
        quickBitSortInt32(array, options);
    } else if (sorter === "P") {
        pCountBitSortInt32(array, options);
    } else if (sorter === "R") {
        radixBitSortInt32(array, options);
    } else if (sorter === "N") {
        let comparator = asc ? (a, b) => a - b : (a, b) => b - a;
        sortSubList(array, start, endP1, comparator, isTypedArray(array));
    } else {
        console.error("sortInt32: invalid sorter type: " + sorter);
    }

}
import {radixBitSortInt32} from "../algorithms/radix-bit-sorter-int.js";
import {pCountBitSortInt32} from "../algorithms/p-count-bit-sorter-int.js";
import {getMaskAsArray, getSortOptions, handleNullsUndefinedAndNans, validateSortRange, N, Q, R, P} from "./sorter-utils.js";
import {quickBitSortInt32} from "../main.js";
import {calculateMaskInt} from "./sorter-utils-int.js";
import {sortSubList} from "../algorithms/native-sorter.js";
import {isTypedArray} from "./utils.js";

let sortMapInt32 =
[
    //2
    [ N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N ],
    [ N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N ],
    [ N, N, N, N, N, Q, N, N, N, N, N, N, N, Q, N, N, N, N, N, N, N, N, N, N ],
    [ P, Q, N, N, N, N, N, N, N, N, N, N, N, N, N, N, Q, N, Q, Q, N, N, Q, N ],
    [ Q, P, Q, Q, Q, Q, N, Q, N, Q, N, Q, Q, Q, Q, Q, N, Q, Q, Q, Q, Q, Q, Q ],
    [ Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q ],
    [ Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q ],
    [ Q, Q, Q, P, Q, Q, Q, P, P, P, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q, Q ],
    [ Q, P, Q, P, Q, Q, P, P, P, P, P, R, R, R, R, R, Q, Q, Q, R, Q, Q, Q, R ],
    [ P, Q, Q, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R, R, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, R ],
    [ P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P ]
    //16777216
];

export function sortInt32(array, options = {}) {
    options.runtime = options.runtime || {};
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
    options.runtime.mask = mask;

    let log2Range = bList.length - 1; //Log2(K)
    let log2Size = Math.ceil(Math.log2(n)) - 1; //Log2(N)
    let log2RangePadded = bList[0] - bList[bList.length - 1] - 1;

    let sorter;
    if (n <= 16) {
        sorter = N;
    } else if (n <= 512) {
        sorter = Q;
    } else {
        if (log2Range <= 23 && log2Size <= 23) {
            sorter = sortMapInt32[log2Size][log2Range];
        } else {
            if (log2Range >= 24) {
                sorter = R;
            } else {
                if (log2Size > log2RangePadded) {
                    sorter = P
                } else {
                    sorter = R
                }
            }
        }
    }
    executeSorterInt32(sorter, array, options, asc, start, endP1);

}


function executeSorterInt32(sorter, array, options, asc, start, endP1) {
    if (sorter === Q) {
        quickBitSortInt32(array, options);
    } else if (sorter === P) {
        pCountBitSortInt32(array, options);
    } else if (sorter === R) {
        radixBitSortInt32(array, options);
    } else if (sorter === N) {
        let comparator = asc ? (a, b) => a - b : (a, b) => b - a;
        sortSubList(array, start, endP1, comparator, isTypedArray(array));
    } else {
        console.error("sortInt32: invalid sorter type: " + sorter);
    }
}
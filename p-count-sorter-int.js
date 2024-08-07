/**
 * Pigeonhole count sort is destructive count sort as it reconstructs (rebuilds)
 * the int numbers, no swaps, reverse or aux arrays.
 * Fastest sorter when the following conditions are met:
 * when max-min (range <= 2**19 is faster than radixBitSorterInt)
 * when max-min (range < 2**25 is faster than javascript sorter)
 * when max-min (range = 2**25 has similar performance than javascript sorter)
 * when max-min (range > 2**25 is slower than javascript sorter)
 *    and when n (endP1-start) 2^17..2^20 (other ranges not tested yet)
 * @param array
 * @param start
 * @param endP1
 * @param min
 * @param max
 */
export function pCountSortInt(array, start, endP1, min, max) {
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
    if (!min || !max) {
        min = array[start];
        max = array[start];
        for (let i = start + 1; i < endP1; i++) {
            let value = array[i];
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
    }
    let range = max - min + 1;
    if (range > 2**24) {
        console.error("Pigeonhole Count sort should be used for number range <= 2**24, for optimal performance: range <= 2**20")
    }
    if (!Number.isInteger(range)) {
        console.error("Pigeonhole Count sort only works on integers")
        return;
    }
    let count = new Array(range).fill(0);
    for (let i = start; i < endP1; i++) {
        count[array[i] - min]++
    }
    let i = start;
    let j = min;
    for (; j <= max; j++) {
        let cMax = count[j - min];
        if (cMax > 0) {
            for (let c = 0; c < cMax; c++) {
                array[i] = j;
                i++;
            }
            if (i === endP1) {
                break;
            }
        }
    }

}

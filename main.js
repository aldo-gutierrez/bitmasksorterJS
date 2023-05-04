import {arraycopy} from "./sorter-utils.js";
import {sortInt} from "./radix-bit-int-sorter.js";
import {sortNumber} from "./radix-bit-number-sorter.js";

console.log("Comparing Sorters\n");

let totalElapsedP = 0;
let totalElapsedK = 0;
let totalElapsedK2 = 0;

const iterations = 20;
const range = 1000;
const size = 1000000;
// const range = 1000000000;
// const size = 40000000;

let testRadixIntSorter = true;
let testRadixNumberSorter = true;

for (let i = 0; i < iterations; i++) {

    //test positive numbers
    let orig = Array.from({length: size}, () => Math.floor(Math.random() * range));

    //test negative/positive numbers
    //let orig = Array.from({length: size}, () => Math.floor(Math.random() * range - range / 2));

    //test negative/positive floating point numbers, set testRadixIntSorter to false and testRadixNumberSorter to true
    //let orig = Array.from({length: size}, () => Math.random() * range - range / 2);

    let arrayJS = Array(size);
    arraycopy(orig, 0, arrayJS, 0, size);
    let start = performance.now();
    arrayJS.sort(function (a, b) {
        return a - b;
    });
    let end = performance.now();
    let elapsedP = end - start;

    let arrayK1;
    let elapsedK;
    if (testRadixIntSorter) {
        arrayK1 = Array(size);
        arraycopy(orig, 0, arrayK1, 0, size);
        start = performance.now();
        sortInt(arrayK1);
        end = performance.now();
        elapsedK = end - start;
    }

    let arrayK2;
    let elapsedK2;
    if (testRadixNumberSorter) {
        arrayK2= Array(size);
        arraycopy(orig, 0, arrayK2, 0, size);
        start = performance.now();
        sortNumber(orig);
        end = performance.now();
        elapsedK2 = end - start;
    }

    if (testRadixIntSorter) {
        let equal = arrayJS.length === arrayK1.length && arrayK1.every(function (value, index) {
            return value === arrayJS[index]
        })
        if (!equal) {
            console.log("Arrays Not Equal RadixBitIntSorter");
            if (arrayJS.length < 300) {
                console.log("OK:  " + arrayJS);
                console.log("NOK: " + arrayK1);
            }
        }
    }

    if (testRadixNumberSorter) {
        let equal = arrayJS.length === arrayK2.length && arrayK2.every(function (value, index) {
            return value === arrayJS[index]
        })
        if (!equal) {
            console.log("Arrays Not Equal RadixBitNumberSorter");
            if (arrayJS.length < 300) {
                console.log("OK:  " + arrayJS);
                console.log("NOK: " + arrayK1);
            }
        }
    }


    console.log("Elapsed Javascript           time:  " + elapsedP + " ms.");
    totalElapsedP += elapsedP;
    if (testRadixIntSorter) {
        console.log("Elapsed RadixBitIntSorter    time:  " + elapsedK + " ms.");
        totalElapsedK += elapsedK;
    }
    if (testRadixNumberSorter) {
        console.log("Elapsed RadixBitNumberSorter time:  " + elapsedK2 + " ms.");
        totalElapsedK2 += elapsedK2;
    }
    console.log("");

}

console.log("AVG elapsed Javascript          time: " + (totalElapsedP / iterations) + " ms.");
if (testRadixIntSorter) {
    console.log("AVG elapsed RadixBitSorterInt   time:  " + (totalElapsedK / iterations) + " ms.");
}
if (testRadixNumberSorter) {
    console.log("AVG elapsed RadixBitSorterFloat time:  " + (totalElapsedK2 / iterations) + " ms.");
}

console.log("\n");
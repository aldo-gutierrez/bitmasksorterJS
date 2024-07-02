// import {sortInt} from "@aldogg/sorter";
// import {sortNumber} from "@aldogg/sorter";
// import {arrayCopy} from "@aldogg/sorter";
//import {pgCountSortInt} from "@aldogg/sorter";

import {arrayCopy} from "../sorter-utils.js";
import {sortObjectInt} from "../radix-bit-sorter-object-int.js";
import {sortObjectNumber} from "../radix-bit-sorter-object-number.js";

console.log("Comparing Sorters\n");

let totalElapsedP = 0;
let totalElapsedK = 0;
let totalElapsedK2 = 0;

const iterations = 20;
const range = 1000;
//2**19;
const size = 1000000;
// const range = 1000000000;
// const size = 40000000;

let testRadixIntSorter = true;
let testRadixNumberSorter = true;

for (let i = 0; i < iterations; i++) {

    //test positive numbers
    let origInt = Array.from({length: size}, () => Math.floor(Math.random() * range));
    let orig = [];
    origInt.forEach(x=> {
       orig.push({
           "id":x,
           "value":"Text"+x
       })
    });


    //test negative/positive numbers
    //let orig = Array.from({length: size}, () => Math.floor(Math.random() * range - range / 2));

    //test negative/positive floating point numbers, set testRadixIntSorter to false and testRadixNumberSorter to true
    //let orig = Array.from({length: size}, () => Math.random() * range - range / 2);

    let arrayJS = Array(size);
    arrayCopy(orig, 0, arrayJS, 0, size);
    let start = performance.now();
    //arrayJS.sort();
    arrayJS.sort(function (a, b) {
        return a.id - b.id;
    });
    let end = performance.now();
    let elapsedP = end - start;

    let arrayK1;
    let elapsedK;
    if (testRadixIntSorter) {
        arrayK1 = Array(size);
        arrayCopy(orig, 0, arrayK1, 0, size);
        start = performance.now();
        sortObjectInt(arrayK1, (x) => x.id);
        end = performance.now();
        elapsedK = end - start;
    }

    let arrayK2;
    let elapsedK2;
    if (testRadixNumberSorter) {
        arrayK2= Array(size);
        arrayCopy(orig, 0, arrayK2, 0, size);
        start = performance.now();
        sortObjectNumber(arrayK2, (x) => x.id);
        //pgCountSortInt(arrayK2, 0, arrayK2.length);
        end = performance.now();
        elapsedK2 = end - start;
    }

    if (testRadixIntSorter) {
        let equal = arrayJS.length === arrayK1.length && arrayK1.every(function (value, index) {
            return value === arrayJS[index]
        })
        if (!equal) {
            console.log("Arrays Not Equal RadixBitObjectIntSorter");
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
            console.log("Arrays Not Equal RadixBitObjectNumberSorter");
            if (arrayJS.length < 300) {
                console.log("OK:  " + arrayJS);
                console.log("NOK: " + arrayK2);
            }
        }
    }


    console.log("Elapsed Javascript           time:  " + elapsedP + " ms.");
    totalElapsedP += elapsedP;
    if (testRadixIntSorter) {
        console.log("Elapsed RadixBitObjectIntSorter    time:  " + elapsedK + " ms.");
        totalElapsedK += elapsedK;
    }
    if (testRadixNumberSorter) {
        console.log("Elapsed RadixBitObjectNumberSorter time:  " + elapsedK2 + " ms.");
        totalElapsedK2 += elapsedK2;
    }
    console.log("");

}

console.log("AVG elapsed Javascript          time: " + (totalElapsedP / iterations) + " ms.");
if (testRadixIntSorter) {
    console.log("AVG elapsed RadixBitObjectIntSorter   time:  " + (totalElapsedK / iterations) + " ms.");
}
if (testRadixNumberSorter) {
    console.log("AVG elapsed RadixBitObjectNumberSorter time:  " + (totalElapsedK2 / iterations) + " ms.");
}

console.log("\n");
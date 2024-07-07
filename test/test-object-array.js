// import {sortInt} from "@aldogg/sorter";
// import {sortNumber} from "@aldogg/sorter";
// import {arrayCopy} from "@aldogg/sorter";
//import {pgCountSortInt} from "@aldogg/sorter";

import {arrayCopy} from "../sorter-utils.js";
import {sortObjectInt} from "../radix-bit-sorter-object-int.js";
import {sortObjectNumber} from "../radix-bit-sorter-object-number.js";

console.log("Comparing Sorters\n");

const algorithm1 = 'Javascript                ';
const algorithm2 = 'RadixBitObjectIntSorter   ';
const algorithm3 = 'RadixBitObjectNumberSorter';

let totalElapsedP = 0;
let totalElapsedK = 0;
let totalElapsedK2 = 0;

const iterations = 20;

const range = 1000;
const size = 1000000;

//const range = 1000000000;
//const size = 1000000;

let testAlgorithm2 = true;
let testAlgorithm3 = true;


for (let i = 0; i < iterations; i++) {

    //test positive numbers
    //let origInt = Array.from({length: size}, () => Math.floor(Math.random() * range));

    //test negative/positive numbers
    //let origInt = Array.from({length: size}, () => Math.floor(Math.random() * range - range / 2));

    //test negative/positive floating point numbers, set testRadixIntSorter to false and testRadixNumberSorter to true
    let origInt = Array.from({length: size}, () => Math.random() * range - range / 2);

    let orig = [];
    origInt.forEach(x => {
        orig.push({
            "id": x,
            "value": "Text" + x
        })
    });

    let arrayJS = Array(size);
    arrayCopy(orig, 0, arrayJS, 0, size);
    let start = performance.now();
    arrayJS.sort(function (a, b) {
        return a.id - b.id;
    });
    let elapsedP = performance.now() - start;

    let arrayK1;
    let elapsedK;
    const mapper = (x) => x.id;

    if (testAlgorithm2) {
        arrayK1 = Array(size);
        arrayCopy(orig, 0, arrayK1, 0, size);
        start = performance.now();
        sortObjectInt(arrayK1, mapper);
        elapsedK = performance.now() - start;
    }

    let arrayK2;
    let elapsedK2;
    if (testAlgorithm3) {
        arrayK2 = Array(size);
        arrayCopy(orig, 0, arrayK2, 0, size);
        start = performance.now();
        sortObjectNumber(arrayK2, mapper);
        //pgCountSortInt(arrayK2, 0, arrayK2.length);
        elapsedK2 = performance.now() - start;
    }

    if (testAlgorithm2) {
        let equal = arrayJS.length === arrayK1.length && arrayK1.every(function (value, index) {
            return value === arrayJS[index]
        })
        if (!equal) {
            console.log(`Arrays Not Equal ${algorithm2}`);
            if (arrayJS.length < 300) {
                console.log("OK:  " + JSON.stringify(arrayJS));
                console.log("NOK: " + JSON.stringify(arrayK1));
            }
        }
    }

    if (testAlgorithm3) {
        let equal = arrayJS.length === arrayK2.length && arrayK2.every(function (value, index) {
            return value === arrayJS[index]
        })
        if (!equal) {
            console.log(`Arrays Not Equal ${algorithm3}`);
            if (arrayJS.length < 300) {
                console.log("OK:  " + JSON.stringify(arrayJS));
                console.log("NOK: " + JSON.stringify(arrayK2));
            }
        }
    }

    console.log(`Elapsed ${algorithm1} time: ${elapsedP} ms.`);
    totalElapsedP += elapsedP;
    if (testAlgorithm2) {
        console.log(`Elapsed ${algorithm2} time: ${elapsedK} ms.`);
        totalElapsedK += elapsedK;
    }
    if (testAlgorithm3) {
        console.log(`Elapsed ${algorithm3} time: ${elapsedK2} ms.`);
        totalElapsedK2 += elapsedK2;
    }
    console.log("");

}

console.log(`AVG elapsed ${algorithm1} time: ${totalElapsedP / iterations} ms.`);
if (testAlgorithm2) {
    console.log(`AVG elapsed ${algorithm2} time:  ${totalElapsedK / iterations} ms.`);
}
if (testAlgorithm3) {
    console.log(`AVG elapsed ${algorithm3} time:  ${totalElapsedK2 / iterations} ms.`);
}

console.log("\n");
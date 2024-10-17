// import {sortInt} from "@aldogg/sorter";
// import {sortNumber} from "@aldogg/sorter";
// import {arrayCopy} from "@aldogg/sorter";
//import {pgCountSortInt} from "@aldogg/sorter";

import {arrayCopy, pCountSortInt, quickBitSorterInt, sortInt, sortNumber} from "../main.js";
import {testArraysEquals} from "./test-utils.js";

console.log("Comparing Sorters\n");

const iterations = 20;
let algorithms = [
    {
        'name': 'JavaScript',
        'sortFunction': (array) => {
            array.sort(function (a, b) {
                return a - b;
            });
            return array;
        }
    },
    {
        'name': 'quickBitSorterInt',
        'sortFunction': (array) => {
            quickBitSorterInt(array);
            return array;
        }
    },
    {
        'name': 'sortInt',
        'sortFunction': (array) => {
            sortInt(array);
            return array;
        }
    },
    {
        'name': 'sortNumber',
        'sortFunction': (array) => {
            sortNumber(array);
            return array;
        }
    },
    {
        'name': 'pCountSortInt',
        'sortFunction': (array) => {
           pCountSortInt(array);
           return array
        }
    },
    {
        'name': 'Float64Array.sort',
        'sortFunction': (array) => {
            return new Float64Array(array).sort();
        }
    },
]


let verbose = false;

let tests = [
    {"range": 1000, "size": 1000000},
    {"range": 1000000, "size": 1000000},
    {"range": 1000000000, "size": 1000000},
    {"range": 1000000000, "size": 40000000}
]


for (let t = 0; t < tests.length; t++) {
    let test = tests[t];
    let range = test.range;
    let size = test.size;

    let generators = [
        {
            "name": `Positive Integer Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => Math.floor(Math.random() * range))
        },
        {
            "name": `Negative Integer Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => -Math.floor(Math.random() * range))
        },
        {
            "name": `Negative/Positive Integer Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => Math.floor(Math.random() * range - range / 2))
        },
        {
            "name": `Negative/Positive Floating Point Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => Math.random() * range - range / 2)
        }
    ]

    for (let g = 0; g < generators.length; g++) {
        let generator = generators[g];
        let origArray = generator.genFunction();

        for (let a = 0; a < algorithms.length; a++) {
            let algorithm = algorithms[a];
            algorithm.totalElapsed = 0;
            algorithm.iterations = 0;
        }

        for (let i = 0; i < iterations; i++) {

            for (let a = 0; a < algorithms.length; a++) {
                let algorithm = algorithms[a];
                let arrayK = Array(size);
                arrayCopy(origArray, 0, arrayK, 0, size);
                let start = performance.now();
                arrayK = algorithm.sortFunction(arrayK);
                let elapsedP = performance.now() - start;
                let equal = true;
                if (a === 0) {
                    algorithm["sortedArray"] = arrayK;
                } else {
                    let arrayJS = algorithms[0]["sortedArray"];
                    equal = testArraysEquals(arrayJS, arrayK, (firstError) => {
                        if (verbose) {
                            console.log(`Arrays Not Equal ${algorithm.name} + error at ${JSON.stringify(firstError)}`);
                        }
                        if (arrayJS.length < 300) {
                            console.log("ORIG: " + JSON.stringify(origArray));
                            console.log("OK  : " + JSON.stringify(arrayJS));
                            console.log("NOK : " + JSON.stringify(arrayK));
                        }
                    }); 
                }
                if (equal) {
                    if (verbose) {
                        console.log(`Elapsed ${algorithm.name} time: ${elapsedP} ms.`);
                    }
                    algorithm.totalElapsed += elapsedP;
                    algorithm.iterations++;
                }
            }
            if (verbose) {
                console.log();
            }
        }

        console.log();
        console.log(`AVG Times for test: ${generator.name}`);
        for (let a = 0; a < algorithms.length; a++) {
            let algorithm = algorithms[a];
            console.log(`${algorithm.name.padEnd(28)} time: ${(algorithm.totalElapsed / iterations).toFixed(6).padStart(12)} ms.`);
        }
    }
}


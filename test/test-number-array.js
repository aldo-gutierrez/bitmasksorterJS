// import {sortInt} from "@aldogg/sorter";
// import {sortNumber} from "@aldogg/sorter";
// import {arrayCopy} from "@aldogg/sorter";
//import {pgCountSortInt} from "@aldogg/sorter";

import {arrayCopy, sortInt, sortNumber, pCountSortInt} from "../main.js";

console.log("Comparing Sorters\n");

const iterations = 20;
let algorithms = [
    {
        'name': 'Javascript          ',
        'sortFunction': (array) => {
            array.sort(function (a, b) {
                return a - b;
            });
            return array;
        }
    },
    {
        'name': 'RadixBitIntSorter   ',
        'sortFunction': (array) => {
            sortInt(array);
            return array;
        }
    },
    {
        'name': 'RadixBitNumberSorter',
        'sortFunction': (array) => {
            sortNumber(array);
            return array;
        }
    },
    // {
    //     'name': 'PingeonCountSorter',
    //     'sortFunction': (array) => {
    //         pCountSortInt(array);
    //         return array;
    //     }
    // },
]


let verbose = false;

let tests = [
    {"range": 1000, "size": 2000},
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
                    let firstError = null;
                    equal = arrayJS.length === arrayK.length && arrayK.every(function (value, index) {
                        if (value === arrayJS[index]) {
                            return true;
                        } else {
                            if (!firstError) {
                                firstError = {"index": index, "expected": arrayJS[index], "real": value};
                            }
                            return false;
                        }
                    })
                    if (!equal) {
                        if (verbose) {
                            console.log(`Arrays Not Equal ${algorithm.name} + error at ${JSON.stringify(firstError)}`);
                        }
                        if (arrayJS.length < 300) {
                            console.log("ORIG: " + JSON.stringify(orig));
                            console.log("OK  : " + JSON.stringify(arrayJS));
                            console.log("NOK : " + JSON.stringify(arrayK));
                        }
                    }
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
        console.log(`Times for test: ${generator.name}`);
        for (let a = 0; a < algorithms.length; a++) {
            let algorithm = algorithms[a];
            console.log(`AVG elapsed ${algorithm.name} time: ${algorithm.totalElapsed / algorithm.iterations} ms.`);
        }
    }
}


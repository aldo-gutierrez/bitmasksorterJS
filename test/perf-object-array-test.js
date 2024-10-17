// import {arrayCopy, sortObjectInt, sortObjectNumber} from "@aldogg/sorter";
//import {sort} from 'fast-sort';
import {
    arrayCopy,
    sortObjectInt,
    radixBitSorterObjectNumber,
    radixBitSorterObjectIntV2,
    sortObjectNumber, quickBitSorterObjectInt
} from "../main.js";
import {testArraysEquals} from "./test-utils.js";

console.log("Comparing Sorters\n");

const iterations = 20;
let algorithms = [
    {
        'name': 'Javascript',
        'sortFunction': (array) => {
            array.sort(function (a, b) {
                return a.id - b.id;
            });
            return array;
        }
    },
    {
        'name': 'sortObjectInt',
        'sortFunction': (array) => {
            sortObjectInt(array, (x) => x.id);
            return array;
        }
    },
    {
        'name': 'radixBitSorterObjectIntV2',
        'sortFunction': (array) => {
            radixBitSorterObjectIntV2(array, (x) => x.id);
            return array;
        }
    },
    {
        'name': 'radixBitSorterObjectNumber',
        'sortFunction': (array) => {
            sortObjectNumber(array, (x) => x.id);
            return array;
        }
    },
    {
        'name': 'quickBitSorterObjectInt',
        'sortFunction': (array) => {
            quickBitSorterObjectInt(array, (x) => x.id);
            return array;
        }
    },
    // {
    //     'name': 'fast-sort                 ',
    //     'sortFunction': (array) => {
    //         array = sort(array).asc((x) => x.id);
    //         return array;
    //     }
    // }
]


let verbose = false;

let tests = [

    {"range": 256, "size": 128},
    {"range": 1024, "size": 128},
    {"range": 4096, "size": 128},
    {"range": 65536, "size": 128},
    {"range": 1048576, "size": 128},
    {"range": 1073741824, "size": 128},

    {"range": 256, "size": 256},
    {"range": 1024, "size": 256},
    {"range": 4096, "size": 256},
    {"range": 65536, "size": 256},
    {"range": 1048576, "size": 256},
    {"range": 1073741824, "size": 256},

    {"range": 256, "size": 512},
    {"range": 1024, "size": 512},
    {"range": 4096, "size": 512},
    {"range": 65536, "size": 512},
    {"range": 1048576, "size": 512},
    {"range": 1073741824, "size": 512},

    {"range": 256, "size": 4096},
    {"range": 1024, "size": 4096},
    {"range": 4096, "size": 4096},
    {"range": 65536, "size": 4096},
    {"range": 1048576, "size": 4096},
    {"range": 1073741824, "size": 4096},

    {"range": 256, "size": 32768},
    {"range": 1024, "size": 32768},
    {"range": 4096, "size": 32768},
    {"range": 65536, "size": 32768},
    {"range": 1048576, "size": 32768},
    {"range": 1073741824, "size": 32768},

    {"range": 256, "size": 65536},
    {"range": 1024, "size": 65536},
    {"range": 4096, "size": 65536},
    {"range": 65536, "size": 65536},
    {"range": 1048576, "size": 65536},
    {"range": 1073741824, "size": 65536},

    {"range": 256, "size": 1048576},
    {"range": 1024, "size": 1048576},
    {"range": 4096, "size": 1048576},
    {"range": 65536, "size": 1048576},
    {"range": 1048576, "size": 1048576},
    {"range": 1073741824, "size": 1048576},
    // {"range": 1000000000, "size": 10000000}, slow
    // {"range": 1000000000, "size": 40000000}, Out of Memory
]

//let origInt = [-488,-860,-212,-82,-35,-831,-751,-898,-329,-831,-362,-207,-862,-315,-154,-361,-141,-614,-503,-180] bug for stable

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
        }

        for (let i = 0; i < iterations; i++) {

            let orig = [];
            origArray.forEach(x => {
                orig.push({
                    "id": x,
                    "value": "Text " + x
                })
            });

            for (let a = 0; a < algorithms.length; a++) {
                let algorithm = algorithms[a];
                let arrayK = Array(size);
                arrayCopy(orig, 0, arrayK, 0, size);
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
                        if (verbose && arrayJS.length < 300) {
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
            if (algorithm.totalElapsed >0) {
                console.log(`${algorithm.name.padEnd(28)} time: ${(algorithm.totalElapsed / iterations).toFixed(6).padStart(12)} ms.`);
            } else {
                console.log(`${algorithm.name.padEnd(28)} with errors.`);
            }
        }
    }
}


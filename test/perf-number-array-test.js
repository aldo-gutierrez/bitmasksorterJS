import {arrayCopy, pCountBitSorterInt, quickBitSorterInt, sortInt, sortNumber} from "../main.js";
import {testArraysEquals} from "./test-utils.js";
import {aFlagBitSorterInt} from "../a-flag-bit-sorter-int.js";

console.log("Comparing Sorters\n");

const iterations = 4; //use 20 for more accuracy in documented results 
let algorithms = [
    {
        'name': 'JavaScriptSorter',
        'sortFunction': (array) => {
            array.sort(function (a, b) {
                return a - b;
            });
            return array;
        },
        'floatingPoint' : true,
        'negative' : true,
    },
    {
        'name': 'QuickBitSorterInt',
        'sortFunction': (array) => {
            quickBitSorterInt(array);
            return array;
        },
        'floatingPoint' : false,
        'negative' : true,
    },
    {
        'name': 'RadixBitSorterInt',
        'sortFunction': (array) => {
            sortInt(array);
            return array;
        },
        'floatingPoint' : false,
        'negative' : true,
    },
    {
        'name': 'RadixBitSorterNumber',
        'sortFunction': (array) => {
            sortNumber(array);
            return array;
        },
        'floatingPoint' : true,
        'negative' : true,
    },
    {
        'name': 'PCountBitSorterInt',
        'sortFunction': (array) => {
           pCountBitSorterInt(array);
           return array
        },
        'floatingPoint' : false,
        'negative' : true,
        'range' : 2 ** 21,
    },
    {
        'name': 'Float64Array.sort',
        'sortFunction': (array) => {
            return new Float64Array(array).sort();
        },
        'floatingPoint' : true,
        'negative' : true,
    },
   {
        'name': 'AFlagBitSorterInt',
        'sortFunction': (array) => {
            aFlagBitSorterInt(array);
            return array
        },
       'floatingPoint' : false,
       'negative' : true,        
    },
]


let verbose = false;

let tests = [
    {"range": 1000, "size": 1000000},
    {"range": 1000000, "size": 1000000},
    {"range": 1000000000, "size": 1000000},
    // {"range": 1000000000, "size": 40000000}
]


for (let t = 0; t < tests.length; t++) {
    let test = tests[t];
    let range = test.range;
    let size = test.size;

    let generators = [
        {
            "name": `Positive Integer Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => Math.floor(Math.random() * range)),
            "negative" : false,
            "floatingPoint": false
        },
        {
            "name": `Negative Integer Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => -Math.floor(Math.random() * range)),
            "negative" : true,
            "floatingPoint": false
        },
        {
            "name": `Negative/Positive Integer Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => Math.floor(Math.random() * range - range / 2)),
            "negative" : true,
            "floatingPoint": false
        },
        {
            "name": `Negative/Positive Floating Point Numbers, range:${range}, size: ${size}`,
            "genFunction": () => Array.from({length: size}, () => Math.random() * range - range / 2),
            "negative" : true,
            "floatingPoint": true
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
                if (!((generator.floatingPoint && !algorithm.floatingPoint) || (generator.negative && !algorithm.negative) || (algorithm.range && algorithm.range < range))) {
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
                        algorithm.iterations++;
                    }
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
            if (!((generator.floatingPoint && !algorithm.floatingPoint) || (generator.negative && !algorithm.negative) || (algorithm.range && algorithm.range < range))) {
                if (algorithm.totalElapsed > 0) {
                    console.log(`${algorithm.name.padEnd(28)} time: ${(algorithm.totalElapsed / iterations).toFixed(6).padStart(12)} ms.`);
                } else {
                    console.log(`${algorithm.name.padEnd(28)} with errors.`);
                }
            }
        }
    }
}


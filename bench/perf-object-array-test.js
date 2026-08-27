import {
    arrayCopy,
    quickBitSortObjectByInt32Key,
    pCountSortObjectByInt32Key,
    quickBitLowMemSortObjectByInt32Key,
    radixBitV2SortObjectByInt32Key,
    radixBitSortObjectByInt32Key,
    radixBitSortObjectByFloat64Key
} from "../src/main.js"; //"@aldogg/sorter"
import {testArraysEquals} from "../test/test-utils.js";

let fastSort = null;
try {
    const _fs = await import('fast-sort');
    fastSort = _fs && (_fs.default || _fs);
} catch (e) {
    console.warn('fast-sort not installed. Install with: npm install --save-dev fast-sort');
}

let timsort = null;
try {
    const _ts = await import('timsort');
    timsort = _ts && (_ts.default || _ts);
} catch (e) {
    console.warn('timsort not installed. Install with: npm --save-dev timsort');
}

console.log("Comparing Sorters\n");

const iterations = 4; //use 20 for more accuracy in documented results 
let algorithms = [
    {
        'name': 'Native ',
        'sortFunction': (array) => {
            array.sort(function (a, b) {
                return a.id - b.id;
            });
            return array;
        },
        'floatingPoint' : true,
        'negative' : true,
    },
    {
        'name': 'RadixBitV2SortObjectByInt32Key',
        'sortFunction': (array) => {
            radixBitV2SortObjectByInt32Key(array, (x) => x.id);
            return array;
        },
        'floatingPoint' : false,
        'negative' : true,
    },
    {
        'name': 'RadixBitSortObjectByInt32Key',
        'sortFunction': (array) => {
            radixBitSortObjectByInt32Key(array, (x) => x.id);
            return array;
        },
        'floatingPoint' : false,
        'negative' : true,
    },
    {
        'name': 'RadixBitSortObjectByFloat64Key',
        'sortFunction': (array) => {
            radixBitSortObjectByFloat64Key(array, (x) => x.id);
            return array;
        },
        'floatingPoint' : true,
        'negative' : true,
    },
    {
        'name': 'QuickBitSortObjectByInt32Key',
        'sortFunction': (array) => {
            quickBitSortObjectByInt32Key(array, (x) => x.id);
            return array;
        },
        'floatingPoint' : false,
        'negative' : true,
    },
    {
        'name': 'PCountSortObjectByInt32Key',
        'sortFunction': (array) => {
            pCountSortObjectByInt32Key(array, (x) => x.id);
            return array;
        },
        'floatingPoint' : false,
        'negative' : true,
        'range' : 2 ** 21,
    },
    {
        'name': 'QuickBitLowMemSortObjectByInt32Key',
        'sortFunction': (array) => {
            quickBitLowMemSortObjectByInt32Key(array, (x) => x.id);
            return array;
        },
        'floatingPoint' : false,
        'negative' : true,
    },
]

if (fastSort) {
    algorithms.push({
        'name': 'Fast-sort',
        'sortFunction': (array) => {
            return fastSort.sort(array).asc( (x) => x.id);
        },
        'floatingPoint' : true,
        'negative' : true,
    });
}

if (timsort) {
    algorithms.push({
        'name': 'Timsort',
        'sortFunction': (array) => {
            const compare = (a, b) => a.id - b.id;
            timsort.sort(array, compare);
            return array;
        },
        'floatingPoint' : true,
        'negative' : true,
    });
}

let verbose = false;

let sizes = [1000, 10000, 100000, 1000000];
let ranges = [1000, 10000, 100000, 1000000, 1000000000];

for (let s = 0; s < sizes.length; s++) {
    let size = sizes[s];
    for (let r = 0; r < ranges.length; r++) {
        let range = ranges[r];

        let generators = [
            {
                "name": `positive integer numbers, size: ${size}, range: ${range}`,
                "genFunction": () => Array.from({length: size}, () => Math.floor(Math.random() * range)),
                "negative": false,
                "floatingPoint": false
            },
            {
                "name": `negative integer numbers, size: ${size}, range: ${range}`,
                "genFunction": () => Array.from({length: size}, () => -Math.floor(Math.random() * range)),
                "negative": true,
                "floatingPoint": false
            },
            {
                "name": `negative/positive integer numbers, size: ${size}, range: ${range}`,
                "genFunction": () => Array.from({length: size}, () => Math.floor(Math.random() * range - range / 2)),
                "negative": true,
                "floatingPoint": false
            },
            {
                "name": `negative/positive floating point numbers, size: ${size}, range: ${range}`,
                "genFunction": () => Array.from({length: size}, () => Math.random() * range - range / 2),
                "negative": true,
                "floatingPoint": true
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
                    if (!((generator.floatingPoint && !algorithm.floatingPoint) || (generator.negative && !algorithm.negative) || (algorithm.range && algorithm.range < range))) {
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
                }
                if (verbose) {
                    console.log();
                }
            }

            console.log();
            console.log(`Test: ${generator.name}`);
            for (let a = 0; a < algorithms.length; a++) {
                let algorithm = algorithms[a];
                if (!((generator.floatingPoint && !algorithm.floatingPoint) || (generator.negative && !algorithm.negative) || (algorithm.range && algorithm.range < range))) {
                    if (algorithm.totalElapsed > 0) {
                        console.log(`${algorithm.name.padEnd(34)} avg time: ${(algorithm.totalElapsed / iterations).toFixed(6).padStart(12)} ms.`);
                    } else {
                        console.log(`${algorithm.name.padEnd(34)} with errors.`);
                    }
                }
            }
        }
    }
}
# BitMask Sorters in Java Script
This project explores various sorting algorithms employing a BitMask approach.
One of the algorithms is a Radix Sort utilizing a BitMask to minimize the number of Count Sort iterations required.

The following code demonstrates the calculation of the BitMask:

```
    function calculateMaskInt(array, start, endP1) {
        let mask = 0x00000000;
        let inv_mask = 0x00000000;
        for (let i = start; i < endP1; i++) {
            let ei = array[i];
            mask = mask | ei;
            inv_mask = inv_mask | (~ei);
        }
        return mask & inv_mask;
    }
```

For further details, refer to the initial Java implementation
[Java Version and Documentation] (https://github.com/aldo-gutierrez/bitmasksorter)

sortInt() executes the radix sort in an array of numbers that are integers in the range -2^31 ... 2^31 -1

sortNumber() executes the radix sort in an array of numbers that contains integer and floating point numbers.

JavaScript numbers are stored as double-precision floating-point numbers, adhering to the international IEEE 754 standard.

## RadixBitSorter:

RadixBitSorter is the implementation of a Radix Sort utilizing a BitMask to minimize the number of Count Sort iterations required.

RadixBitSorter is an LSD Radix Sorter. 
The number of bits per iteration has been increased to 11, departing from the standard 8.
For a dual-core machine or lower, it is recommended to use 8 bits.

# Speed
### Comparison for sorting 1 million integer elements ranging from 0 to 1000.
Environment: AMD Ryzen 7 4800H processor, node v16.13.2

| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                207 |
| RadixBitIntSorter       |                 12 |
| RadixBitNumberSorter    |                 30 |


### Comparison for sorting 1 million integer elements ranging from 0 to 1000 million.
Environment: AMD Ryzen 7 4800H processor, node v16.13.2


| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                263 |
| RadixBitIntSorter       |                 30 |
| RadixBitNumberSorter    |                 51 |


### Comparison for sorting 40 million integer elements ranging from 0 to 1000 million.
Environment: AMD Ryzen 7 4800H processor, node v16.13.2


| Algorithm            | avg. CPU time [ms] |
|----------------------|-------------------:|
| Javascript sort      |              13231 |
| RadixBitIntSorter    |              10863 |
| RadixBitNumberSorter |               5133 |

# USAGE

```javascript
import {sortInt} from "@aldogg/sorter";
import {sortNumber} from "@aldogg/sorter";

//sortInt can sort negative and positive integer numbers in the range -2^31 ... 2^31-1 ONLY
let array = Array.from({length: size}, () => Math.floor(Math.random() * range - range / 2));
let array = new Float32Array(); //ONLY range -2^24 ... 2^24-1
let array = new Float64Array(); //ONLY range -2^31 ... 2^31-1
let array = new Int8Array();
let array = new Int16Array();
let array = new Int32Array();
let array = new Uint8Array();
let array = new Uint16Array();
let array = new Uint32Array();  //ONLY positive intenger numbers 0 ... 2^31-1
//let array =  BigInt64Array(); //BigInt is not supported neither BigInt64

sortInt(array);

//sortNumber can sort negative and positive decimal numbers in the range supported by a Float64 IIEE 754
let arrayF = Array.from({length: size}, () => Math.random() * range - range / 2);
let arrayF = new Float32Array();
let arrayF = new Float64Array();
let arrayF = new Int8Array();
let arrayF = new Int16Array();
let arrayF = new Int32Array();
let arrayF = new Uint8Array();
let arrayF = new Uint16Array();
let arrayF = new Uint32Array();
//let array =  BigInt64Array(); //BigInt is not supported neither BigInt64

sortNumber(arrayF)



```
# TODO
- Make a sorter for Objects with number fields
- Learn WebAssembly and SIMD and apply it
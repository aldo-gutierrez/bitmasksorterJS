# BitMask Sorters in Java Script
This project tests different ideas for sorting algorithms.
One of them is a binary RadixSorter that reduces passes by using a BitMask

See the initial implementation in java for more information.
[Java Version and Documentation] (https://github.com/aldo-gutierrez/bitmasksorter)

sortInt() executes the radix sort in an array of numbers that are integers in the range -2^31 ... 2^31 -1

sortNumber() executes the radix sort in an array of numbers that contains integer and floating point numbers.
JavaScript's numbers are always stored as double precision floating point numbers, following the international IEEE 754 standard.

## RadixBitSorter:
RadixBitSorter is a binary LSD Radix Sorter that uses the bitmask to reduce the passes of a radix sorter
the max length of each set of bits is 11, but in an old machine 8 is recommended

# Speed
Comparison for sorting 1 Million int elements with range from 0 to 1000 in an AMD Ryzen 7 4800H processor,
node v16.13.2

| Algorithm               | AVG CPU time [ms] |
|-------------------------|------------------:|
| Javascript sort         |               207 |
| RadixBitIntSorter       |                13 |
| RadixBitNumberSorter    |                30 |


Comparison for sorting 40 Million int elements with range from 0 to 1000 Million in an AMD Ryzen 7 4800H processor,
node v16.13.2


| Algorithm            | AVG CPU time [ms] |
|----------------------|------------------:|
| Javascript sort      |             13175 |
| RadixBitIntSorter    |             12044 |
| RadixBitNumberSorter |             12217 |

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
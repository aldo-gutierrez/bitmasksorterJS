# BitMask Sorters in Java Script
This project explores various sorting algorithms employing a BitMask approach.
The first implemented algorithms is a Radix Sort utilizing a BitMask to minimize the number of Count Sort iterations required.

This Radix sort can be from 4x to 16x times faster than standard Javascript sort

The following code demonstrates the calculation of the BitMask of a 32 bit number:

```javascript
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
JavaScript Numbers are stored as double-precision floating-point numbers, adhering to the international IEEE 754 standard.
so for numbers out of the integer range -2^31 ... 2^31 -1 and also for floating point numbers two mask are extracted for the lower 32 bits and upper 32 bits 

For further details, refer to the initial Java implementation
[Java Version and Documentation] (https://github.com/aldo-gutierrez/bitmasksorter)

## Principal functions:

sortInt() executes the radix sort in an array of numbers that are integers in the range -2^31 ... 2^31 -1. Unstable sort

sortNumber() executes the radix sort in an array of numbers that contains integer and floating point numbers. Unstable sort

sortObjectInt() executes the radix sort in an array of objects with number keys that are integers in the range -2^31 ... 2^31 -1. Stable sort

sortObjectNumber() executes the radix sort in an array of objects with number keys that contains integer and floating point numbers. Stable sort

## Usage

### For sorting array of numbers

```javascript
import {sortInt} from "@aldogg/sorter";
import {sortNumber} from "@aldogg/sorter";

// sortInt can sort negative and positive integer numbers in the range -2^31 ... 2^31-1 ONLY
// array can be: a normal array, Int8Array, Int16Array, Int32Array(), Uint8Array(), Uint16Array()
//    limited support for all integers in the range  -2^31 ... 2^31-1 for Float32Array, Float64Array, Uint32Array
//    No support for BintInt64 or BigInt64Array();
sortInt(array);

//sortNumber can sort negative and positive decimal numbers in the range supported by a Float64 IIEE 754
// arrayF can be a normal array, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array;
//   No support for BintInt64 or BigInt64Array();

sortNumber(arrayF)

```
### For sorting array of objects

```javascript
import {sortObjectInt, sortObjectNumber} from "@aldogg/sorter";

//sortObjectInt can sort objects with negative and positive integer fields in the range -2^31 ... 2^31-1 ONLY

sortObjectInt(orig, (x) => x.id);

//sortObjectNumber can sort objects with negative and positive decimal fields in the range of IEEE 754

sortObjectNumber(orig2, (x) => x.id);

```

## RadixBitSorter:

RadixBitSorter is the implementation of a Radix Sort utilizing a BitMask to minimize the number of Count Sort iterations required.

RadixBitSorter is an LSD Radix Sorter. 
The number of bits per iteration has been increased to 11, departing from the standard 8.
For a dual-core machine or lower, it is recommended to use 8 bits.

## Benchmark Environment

Environment: AMD Ryzen 7 4800H processor, node v16.13.2

## Benchmark Integer Numbers

### Comparison for sorting 1 million integer elements ranging from 0 to 1 million.

| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                274 |
| RadixBitIntSorter       |                 20 |
| RadixBitNumberSorter    |                 39 |

### Comparison for sorting 1 million integer elements ranging from 0 to 1000.

| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                223 |
| RadixBitIntSorter       |                 12 |
| RadixBitNumberSorter    |                 30 |


### Comparison for sorting 1 million integer elements ranging from 0 to 1000 million.

| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                277 |
| RadixBitIntSorter       |                 30 |
| RadixBitNumberSorter    |                 51 |


### Comparison for sorting 40 million integer elements ranging from 0 to 1000 million.

| Algorithm            | avg. CPU time [ms] |
|----------------------|-------------------:|
| Javascript sort      |              13647 |
| RadixBitIntSorter    |              11008 |
| RadixBitNumberSorter |              11892 |

## Speed Floating Point Numbers

### Comparison for sorting 1 million floating-point elements ranging from 0 to 1 million.

| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                620 |
| RadixBitNumberSorter    |                 71 |

### Comparison for sorting 1 million floating-point elements ranging from 0 to 1000.

| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                637 |
| RadixBitNumberSorter    |                 71 |


### Comparison for sorting 1 million floating-point elements ranging from 0 to 1000 million.

| Algorithm               | avg. CPU time [ms] |
|-------------------------|-------------------:|
| Javascript sort         |                617 |
| RadixBitNumberSorter    |                 70 |


## Speed sorting Objects

### Comparison for sorting 1 million objects with integer keys ranging from 0 to 1 million.

| Algorithm                  | avg. CPU time [ms] |
|----------------------------|-------------------:|
| Javascript sort            |                568 |
| fast-sort 3.4.0            |                630 |
| RadixBitObjectIntSorter    |                176 |
| RadixBitObjectNumberSorter |                 76 |

### Comparison for sorting 1 million objects with integer keys ranging from 0 to 1000.

| Algorithm                  | avg. CPU time [ms] |
|----------------------------|-------------------:|
| Javascript sort            |                307 |
| fast-sort 3.4.0            |                361 |
| RadixBitObjectIntSorter    |                 20 |
| RadixBitObjectNumberSorter |                 55 |

### Comparison for sorting 1 million objects with integer keys ranging from 0 to 1000 million.

| Algorithm                  | avg. CPU time [ms] |
|----------------------------|-------------------:|
| Javascript sort            |                592 |
| fast-sort 3.4.0            |                691 |
| RadixBitObjectIntSorter    |                220 |
| RadixBitObjectNumberSorter |                130 |

### Comparison for sorting 1 million objects with floating point  keys ranging from 0 to 1 million.

| Algorithm                  | avg. CPU time [ms] |
|----------------------------|-------------------:|
| Javascript sort            |                760 |
| fast-sort 3.4.0            |                779 |
| RadixBitObjectNumberSorter |                183 |

### Comparison for sorting 1 million objects with floating point keys ranging from 0 to 1000.

| Algorithm                  | avg. CPU time [ms] |
|----------------------------|-------------------:|
| Javascript sort            |                770 |
| fast-sort 3.4.0            |                776 |
| RadixBitObjectNumberSorter |                189 |

### Comparison for sorting 1 million objects with floating point keys ranging from 0 to 1000 million.

| Algorithm                  | avg. CPU time [ms] |
|----------------------------|-------------------:|
| Javascript sort            |                804 |
| fast-sort 3.4.0            |                770 |
| RadixBitObjectNumberSorter |                185 |

# TODO

- [X] Test integer positive numbers
- [X] Test integer negative numbers
- [X] Test integer positive/negative numbers
- [X] Test floating point positive/negative numbers
- [X] Test object sorting stability
- [ ] Try WebAssembly
- [ ] Try SIMD
- [ ] Try QuickSort with Bitmask
- [X] Implement Pigeonhole sort
- [ ] Integrate Pigeonhole sort with Bitmask
- [ ] Implement Bucket sort
- [ ] Optimization for small lists (like in java version)
- [ ] Support asc, desc options
- [ ] Implement Ska Sort
- [ ] Implement Ska Sort with BitMask
- [ ] Implement String sorting
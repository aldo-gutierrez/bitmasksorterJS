# BitMask Sorters in Java Script
This project tests different ideas for sorting algorithms.
One of them is a binary RadixSorter that reduces passes by using a BitMask

See the initial implementation in java for more information.
[Java Version and Documentation] (https://github.com/aldo-gutierrez/bitmasksorter)

sortInt() executes the radix sort in an array of numbers that are integers in the range -2^31 ... 2^31 -1

sortNumber() executes the radix sort in an array of numbers that contains integer and floating point numbers.
JavaScript numbers are always stored as double precision floating point numbers, following the international IEEE 754 standard.

## RadixBitSorter:
RadixBitSorter is a binary LSD Radix Sorter that uses the bitmask to reduce the passes of a radix sorter
the max length of each set of bits is 11, but in an old machine 8 is recommended

# Speed
Comparison for sorting 1 Million int elements with range from 0 to 1000 in an AMD Ryzen 7 4800H processor,
node v16.13.2

| Algorithm               | AVG CPU time [ms] |
|-------------------------|------------------:|
| Javascript sort         |               225 |
| RadixBitIntSorter       |                13 |
| RadixBitNumberSorter    |                34 |


Comparison for sorting 40 Million int elements with range from 0 to 1000 Million in an AMD Ryzen 7 4800H processor,
node v16.13.2


| Algorithm            | AVG CPU time [ms] |
|----------------------|------------------:|
| Javascript sort      |             13178 |
| RadixBitIntSorter    |             12002 |
| RadixBitNumberSorter |             20900 |

# TODO
- Make a sorter for Objects with number fields
- Make a library
- Learn WebAssembly and SIMD
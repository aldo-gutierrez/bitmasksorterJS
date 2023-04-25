# BitMask Sorters in Java Script
This project tests different ideas for sorting algorithms.
One of them is a binary RadixSorter that reduces passes by using a BitMask

See the initial implementation in java for more information.
[Java Version and Documentation] (https://github.com/aldo-gutierrez/bitmasksorter)

sorterInt() executes the radix sort in an array for numbers that are integers in the range -2^31 ... 2^31 -1
sorterFloat() executes the radix sort in an array that contains integers and floats (currently only supporting positive numbers)

## RadixBitSorter:
RadixBitSorter is a binary LSD Radix Sorter that uses the bitmask to reduce the passes of a radix sorter
the max length of each set of bits is 11, but in a old machine 8bits is recommended

# Speed
Comparison for sorting 1 Million int elements with range from 0 to 1000 in an AMD Ryzen 7 4800H processor,
node v16.13.2

| Algorithm         | AVG CPU time [ms] |
|-------------------|------------------:|
| Javascript sort   |               225 |
| RadixBitSorterInt |                13 |

And as expected if we increment the range the difference between RadixBitSorterInt and JS sort is reduced

Comparison for sorting 40 Million int elements with range from 0 to 1000 Million in an AMD Ryzen 7 4800H processor,
node v16.13.2


| Algorithm         | AVG CPU time [ms] |
|-------------------|------------------:|
| Javascript sort   |             13850 |
| RadixBitSorterInt |             11783 |

# TODO
- Make a library
- Learn WebAssembly SIMD
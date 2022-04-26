# Mask Bit Sorters Java Script
This project tests different ideas for sorting algorithms.
We use a bitmask as a way to get statistical information about the numbers to be sorted.
All the algorithms use this bitmask.

See the initial implementation in java for more information.
[Java Version and Documentation] (https://github.com/aldo-gutierrez/bitmasksorter)

Only a test of RadixBitSorter is implemented for now in this project

## RadixBitSorter:
RadixBitSorter is a Radix Sorter that uses the bitmask to make a LSD sorting using bits instead of bytes
upto 11 bits at a time.

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
- Analyze how to fix the problem that bit operations is done on a 64-bit float converted each time to a 64-bit int-
- Learn javascript type arrays
- Support float numbers
- Make a library
- Learn WebAssembly SIMD
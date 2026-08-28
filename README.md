# BitMask Sorters in JavaScript: 2x to 20x faster

[NPMJS](https://www.npmjs.com/package/@aldogg/sorter)
[Repository](https://github.com/aldo-gutierrez/bitmasksorterJS)

This project explores sorting algorithms that use a BitMask optimization to improve performance.

The following code demonstrates how to calculate the BitMask of a 32-bit integer:

```javascript
function calculateMaskInt(array, start, endP1) {
    let mask = 0x00000000;
    let invMask = 0x00000000;

    for (let i = start; i < endP1; i++) {
        const ei = array[i];
        mask = mask | ei;
        invMask = invMask | (~ei);
    }

    return mask & invMask;
}
```

JavaScript numbers are stored as double-precision floating-point values following the IEEE 754 standard. However, JavaScript bit operations work on 32-bit integers. Because of this, we need to manage two masks: one for the lower 32 bits and one for the upper 32 bits.

For more details, see the original Java implementation:
[Java Version and Documentation](https://github.com/aldo-gutierrez/bitmasksorter)

## Main functions

This functions select the best algorithm, for bigger numbers most of the time a RadixBitSort

- `sortInt32(array, options)` executes a unstable sort on arrays of integer numbers in the range `-2^31 ... 2^31 - 1`.
- `sortFLoat64(array, options)` executes a unstable sort on arrays of numeric values.
- `sortObjectByInt32Key(array, (x) => x.key, options)` executes a stable sort on arrays of objects with integer keys in the range `-2^31 ... 2^31 - 1`.
- `sortObjectByFloat64Key(array, (x) => x.key, options)` executes a stable sort on arrays of objects with numeric keys.
- `sort(array, (x) => x.key, options)` executes a stable sort on arrays of objects with key.
- `sort(array, [{"key": (x) => x.key}, {"key", (x) => x.id}], options)` executes a stable sort on arrays of objects with multiples keys.

## Usage

### Sorting arrays of numbers

These methods automatically choose the best algorithm depending on the array size and value range.

```javascript
import { sortInt32, sortFLoat64 } from "@aldogg/sorter";

// Can sort negative and positive integer numbers in the range -2^31 ... 2^31 - 1
// Supports arrays and typeArrays
sortInt32(array, {"order":"asc"});

// Can sort negative and positive IEEE 754 64-bit numbers
// Supported arrays and TypeArrays
sortFLoat64(array, {"order":"desc"});
```

### Sorting arrays of objects

These methods automatically choose the best algorithm depending on the array size and value range.

```javascript
import { sortObjectByInt32Key, sortObjectByFloat64Key } from "@aldogg/sorter";

// sortObjectInt can sort objects with negative and positive integer keys in the range -2^31 ... 2^31 - 1 only
sortObjectByInt32Key(orig, (x) => x.id);

// sortObjectNumber can sort objects with IEEE 754 numeric keys
sortObjectByFloat64Key(orig, (x) => x.id);
```

### MultiSort


```javascript
import { sort} from "@aldogg/sorter";

// sort Array of numbers
sort([1,9,-1,3,2,null], {"order":"asc", "nulls":"first"});

// sort Array of Objects by key
sort(arrayObj, (x) => x.id, {"order":"asc", "nulls":"last"});

// sort Array of Objects by multiple keys
sort(arrayObj, [{"key": (x) => x.time, type:"float64", order:"asc"}, {"key": (x) => x.year, type:"int32", order:"desc"}], {"nulls":"last"});
```


## RadixBitSorter

`RadixBitSorter` is a radix sort that uses a BitMask to reduce the number of counting-sort iterations required. This modified radix sort can be between 2x and 20x faster than the standard JavaScript sort.

`RadixBitSorter` is an LSD radix sorter.

The number of bits per iteration has been increased to 11 instead of the usual 8. For dual-core or lower-end machines, using 8 bits is recommended.

## Benchmark environment

Environment: AMD Ryzen 7 4800H processor, Node v16.13.2

## Benchmark: integer numbers

### Sorting 1 million integer elements ranging from 0 to 1 million

| Algorithm            |     avg. time [ms] |
|----------------------|-------------------:|
| Native Sort          |                275 |
| RadixBitIntSorter    |                 21 |
| RadixBitNumberSorter |                 41 |
| PCountBitSortInt32   |                 18 | 
| Fast-sort            |                342 | 
| Timsort              |                149 | 

### Sorting 1 million integer elements ranging from 0 to 1000

| Algorithm           |     avg. time [ms] |
|---------------------|-------------------:|
| Native Sort         |                220 |  
| RadixBitSortInt32   |                 11 |
| RadixBitSortFloat64 |                 32 |
| PCountBitSortInt32  |                  4 |
| Fast-sort 3.4.1     |                286 |
| Timsort 0.3.0       |                118 |

### Sorting 1 million integer elements ranging from 0 to 1,000,000,000

| Algorithm           |       avg. time [ms] |
|---------------------|---------------------:|
| Native Sort         |                  271 |
| RadixBitSortInt32   |                   29 |
| RadixBitSortFloat64 |                   51 |
| Fast-sort 3.4.1     |                  350 |
| Timsort 0.3.0       |                  141 |                   

### Sorting 40 million integer elements ranging from 0 to 1,000,000,000

| Algorithm                | avg. time [ms] |
|--------------------------|---------------:|
| Native Sort              |          13572 |
| RadixBitSortInt32 v0.7   |          11123 |
| RadixBitSortFloat64 v0.7 |           4539 |
| RadixBitSortInt32 v0.8   |           8439 |
| RadixBitSortFloat64 v0.8 |           2187 |
| Fast-sort 3.4.1          |          17286 |
| Timsort 0.3.0            |           6902 |

## Benchmark: floating-point numbers

### Sorting 1 million floating-point elements ranging from 0 to 1 million

| Algorithm                | avg. time [ms] |
|--------------------------|---------------:|
| Native sort              |            604 |
| RadixBitSortFloat64 v0.8 |             67 |
| Fast-sort 3.4.1          |            638 |
| Timsort 0.3.0            |            186 |

### Sorting 1 million floating-point elements ranging from 0 to 1000

| Algorithm                | avg. time [ms] |
|--------------------------|---------------:|
| Native sort              |            597 |
| RadixBitSortFloat64 v0.8 |             67 |
| Fast-sort 3.4.1          |            747 |
| Timsort 0.3.0            |            183 |

### Sorting 1 million floating-point elements ranging from 0 to 1,000,000,000

| Algorithm            | avg. time [ms] |
|----------------------|---------------:|
| Native sort          |            598 |
| RadixBitNumberSorter |             68 |
| Fast-sort 3.4.1      |            710 |
| Timsort 0.3.0        |            184 |

## Benchmark: objects

### Sorting 1 million objects with integer keys ranging from 0 to 1 million

| Algorithm                      | avg. time [ms] |
|--------------------------------|---------------:|
| Native sort                    |            535 |
| RadixBitSortObjectByInt32Key   |            118 |
| RadixBitV2SortObjectByInt32Key |             48 |
| RadixBitSortObjectByFloat64Key |             81 |
| Fast-sort 3.4.0                |            596 |
| Timsort 0.3.0                  |            299 |

### Sorting 1 million objects with integer keys ranging from 0 to 1000

| Algorithm                      | avg. time [ms] |
|--------------------------------|---------------:|
| Native sort                    |            279 |
| RadixBitSortObjectByInt32Key   |             19 |
| RadixBitV2SortObjectByInt32Key |             31 |
| RadixBitSortObjectByFloat64Key |             59 |
| Fast-sort 3.4.0                |            322 |
| Timsort 0.3.0                  |            168 |

### Sorting 1 million objects with integer keys ranging from 0 to 1,000,000,000

| Algorithm                      | avg. time [ms] |
|--------------------------------|---------------:|
| Native sort                    |            521 |
| RadixBitSortObjectByInt32Key   |            218 |
| RadixBitV2SortObjectByInt32Key |             64 |
| RadixBitSortObjectByFloat64Key |            100 |
| Fast-sort 3.4.0                |            618 |
| Timsort 0.3.0                  |            315 |

### Sorting 1 million objects with floating-point keys ranging from 0 to 1 million

| Algorithm                           | avg. time [ms] |
|-------------------------------------|---------------:|
| Native Sort                         |            835 |
| RadixBitSortObjectByFloat64Key v0.8 |            162 |
| RadixBitSortObjectByFloat64Key v0.7 |            183 |
| fast-sort 3.4.0                     |            784 |
| Timsort                             |            422 |

### Sorting 1 million objects with floating-point keys ranging from 0 to 1000

| Algorithm                           | avg. time [ms] |
|-------------------------------------|---------------:|
| Native Sort                         |            855 |
| RadixBitSortObjectByFloat64Key v0.8 |            165 |
| RadixBitSortObjectByFloat64Key v0.7 |            189 |
| fast-sort 3.4.0                     |            781 |
| Timsort                             |            426 |

### Sorting 1 million objects with floating-point keys ranging from 0 to 1,000,000,000

| Algorithm                      | avg. time [ms] |
|--------------------------------|---------------:|
| Native Sort                    |            825 |
| RadixBitSortObjectByFloat64Key |            165 |
| fast-sort 3.4.0                |            764 |
| Timsort                        |            421 |

## DONE v0.8

- [x] Support integer positive numbers
- [x] Support integer negative numbers
- [x] Support floating-point numbers
- [x] Support object sort with integer keys
- [x] Support object sort with float keys
- [x] Support Stable sort
- [x] Support nulls and undefined
- [X] Support `asc` and `desc` order
- [x] Support Radix Sort with BitMask → RadixBitXXXSorter
- [x] Support Quick Sort with BitMask → QuickBitXXXSorter
- [x] Test Pigeonhole Sort / Count Sort / Bucket Sort with BitMask → PCountBitXXXSorter (Only 32 bits)
- [x] Test American Flag Sort with BitMask → AmericanBitXXXSorter (Only 32 bits)
- [x] Full Regression and Smoke Test
- [x] Benchmark Scripts

## TODO OPENSOURCE VERSION
- [ ] Create ShortListOrRangeXXXSorter to choose the best algorithm when n <= 2^16 or range <= 2^16. The best algorithm is selected from PCountSort, QuickBitSort, and RadixBitSort.
- [ ] Support String sorting by falling back to native JavaScript sort
- [ ] Support Boolean Sorting with a fallback or a fast method

## OPEN SOURCE FINAL VERSION
* RadixBitSorter for all needed types
* QuickBitSorter for all needed types
* RadixBitSorter / QuickBitSorter using optionally ShortListOrRangeSorter

## PAID VERSION
* RadixBitXXXSorter for all types
* QuickBitXXXSorter for all types
* PCountBitXXXSorter for all types
* AmericanFlagBitSorter / SkaBitSorter for all types
* Optimized String Sorting, maybe with BitMask
* Support for sorting int64 and BigInt up to 2^64
* Parallelism
* Full code coverage
* WebAssembly (*Pro version)
* SIMD (*Pro version)
* Support for sorting BigInt up to 2^128 (*Pro version)
* Other sort algorithms with BitMask (*Pro version)

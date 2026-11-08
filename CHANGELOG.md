# [v0.1.4](https://github.com/aldo-gutierrez/bitmasksorterJS/releases/tag/v0.1.4)
**Nov 19, 2026**

**Changes:**
- Fix for radix-bit-v2-sorter-objet-int.js arrayInt32 array
- Updated Documentation

# [v0.1.3](https://github.com/aldo-gutierrez/bitmasksorterJS/releases/tag/v0.1.3)
**Nov 8, 2026**

**Changes:**
- Fix for quick-bit-lm-sorter-object when changing to radix sorter
- Deno Lint fixes
- Support for a-flag-bit-sorter desc order
- Optimized BigInt64Array and BigUint64Array sort
- Updated Documentation
- Fixes for BigInt sorting and improvement of performance
- Added more unittests

# [v0.1.2](https://github.com/aldo-gutierrez/bitmasksorterJS/releases/tag/v0.1.2)
**Oct 10, 2026**

**Changes:**
- Fixed PCountSort desc order when having positive and negative numbers
- Deno Lint fixes


# [v0.1.0](https://github.com/aldo-gutierrez/bitmasksorterJS/releases/tag/v0.1.0)
**Oct 2, 2026**

**Changes:**

- Improved documentation.
- Configured NaN values to sort last by default when null sorting is enabled.
- Improved Low Memory QuickBitSorter to almost match Native Sorter, faster in some cases, slower in others.
- Updated Node.js CI matrix to support versions 20–26.
- Added support for setting MAX_BITS_RADIX_SORT to 8 for low-N cases.
- Updated section bit calculations to use balance bit distribution.
- Generated sort matrix for sortInt32 to choose the best option automatically.
- Generated sort matrix for sortObjectByInt32Key to choose the best option automatically.
- pCountSortObjectByInt32Key and pCountBitSortInt32 now support descending order.
- Support for BigInt.
- Add terser.
- Add html test pages for testing the library on ie11 and ios12.
- Performance Improvements.
- Minor refactoring and code cleanup.

# [v0.0.8](https://github.com/aldo-gutierrez/bitmasksorterJS/releases/tag/v0.0.8)
**Aug 30, 2026**

Changes:

- Added a general/generic, easy-to-use sort() function; it is now the main entry point.
- Supported ascending and descending order.
- Supported null and undefined values.
- Optimized BitMask calculation.
- Ran full regression, smoke, and benchmark tests.
- Added support for boolean sorting using sortInt32.
- Added support for string sorting (not using Bitmask yet).

Breaking changes:

- renamed sortInt to sortIn32
- renamed sorNumber to sortFLoat64
- renamed sortObjectInt to sortObjectByInt32Key
- renamed sortObjectNumber to sortObjectByFloat64Key


# v0.0.7
**Jan 14, 2025**

QuickSorter wit BitMask -> QuickBitSort
PCountSort fixes ad performance optimizations, different strategies PigeonHole
Added PCountBitObject sorter, stable sorting
Added America flag sort with BitMask -> AmericanFlagBitSorter
Created Low Mem / Zero Mem stable partition algorithm white/black blocks merge
Created Section object to represent mask, bits, shift, etc.

# v0.0.6 
**Jul 12, 2024**

First npmjs release  
General fixes documentation and performance improvements  
general functions sortInt, sortNumber, sortObjectInt sortObjectNumber  
Support for Negative Numbers  
Support for Floating point numbers  
Support for ascending order only  
PCountSort: faster destructive count sorter for integers  
RadixSorters with BitMask  
Fixes for -0  
Fixes for only negative numbers
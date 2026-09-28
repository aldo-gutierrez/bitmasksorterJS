import assert from 'assert';
import { getSections, getMaskAsArray, getMaskRangeBits } from '../src/utils/sorter-utils.js';

describe('getSections Unit Tests', function () {
    describe('Empty and nullish inputs', function () {
        it('returns empty array when bList is null', function () {
            assert.deepStrictEqual(getSections(null), []);
        });

        it('returns empty array when bList is undefined', function () {
            assert.deepStrictEqual(getSections(undefined), []);
        });

        it('returns empty array when bList is empty', function () {
            assert.deepStrictEqual(getSections([]), []);
        });
    });

    describe('Single-element bit lists', function () {
        it('returns one section for bit 0', function () {
            const result = getSections([0]);
            assert.deepStrictEqual(result, [
                { bits: 1, shift: 0, start: 0, mask: 1, range: 2 }
            ]);
        });

        it('returns one section for a non-zero bit', function () {
            const result = getSections([5]);
            assert.deepStrictEqual(result, [
                { bits: 1, shift: 5, start: 5, mask: 1 << 5, range: 2 }
            ]);
        });

        it('returns one section for bit 31', function () {
            const result = getSections([31]);
            assert.deepStrictEqual(result, [
                { bits: 1, shift: 31, start: 31, mask: 1 << 31, range: 2 }
            ]);
        });
    });

    describe('Default maxBitsDigit (11 bits)', function () {
        it('groups contiguous bits within 11 bits into a single section', function () {
            // bList is descending order from getMaskAsArray (e.g. bits 0..3)
            const bList = [3, 2, 1, 0];
            const result = getSections(bList);
            assert.deepStrictEqual(result, [
                { bits: 4, shift: 0, start: 3, mask: 0b1111, range: 16 }
            ]);
        });

        it('groups exactly 11 contiguous bits into a single section', function () {
            const bList = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
            const result = getSections(bList);
            assert.deepStrictEqual(result, [
                { bits: 11, shift: 0, start: 10, mask: 2047, range: 2048 }
            ]);
        });

        it('spans sparse bits within the 11-bit window', function () {
            // Bits 0 and 10 set
            const bList = [10, 0];
            const result = getSections(bList);
            assert.deepStrictEqual(result, [
                { bits: 11, shift: 0, start: 10, mask: 2047, range: 2048 }
            ]);
        });

        it('splits when contiguous bits exceed 11 bits', function () {
            // Bits 0..11 (12 bits total)
            const bList = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
            const result = getSections(bList);
            assert.deepStrictEqual(result, [
                { bits: 6, shift: 0, start: 5, mask: 63, range: 64 },
                { bits: 6, shift: 6, start: 11, mask: 63 << 6, range: 64 }
            ]);
        });

        it('splits non-contiguous bits when the gap exceeds 11 bits', function () {
            // Bit 0 and bit 12 (span = 13 bits > 11)
            const bList = [12, 0];
            const result = getSections(bList);
            assert.deepStrictEqual(result, [
                { bits: 1, shift: 0, start: 0, mask: 1, range: 2 },
                { bits: 1, shift: 12, start: 12, mask: 1 << 12, range: 2 }
            ]);
        });

        it('splits all 32 contiguous bits into 3 sections (11 + 11 + 10 bits)', function () {
            const bList = Array.from({ length: 32 }, (_, i) => 31 - i);
            const result = getSections(bList);
            assert.strictEqual(result.length, 3);
            assert.deepStrictEqual(result[0], { bits: 11, shift: 0, start: 10, mask: 0x7FF, range: 2048 });
            assert.deepStrictEqual(result[1], { bits: 11, shift: 11, start: 21, mask: 0x7FF << 11, range: 2048 });
            assert.deepStrictEqual(result[2], {
                bits: 10,
                shift: 22,
                start: 31,
                mask: getMaskRangeBits(31, 22),
                range: 1024
            });
        });
    });

    describe('Custom maxBitsDigit', function () {
        it('handles maxBitsDigit = 1 (1 bit per section)', function () {
            const bList = [3, 2, 1, 0];
            const result = getSections(bList, 1);
            assert.deepStrictEqual(result, [
                { bits: 1, shift: 0, start: 0, mask: 1, range: 2 },
                { bits: 1, shift: 1, start: 1, mask: 2, range: 2 },
                { bits: 1, shift: 2, start: 2, mask: 4, range: 2 },
                { bits: 1, shift: 3, start: 3, mask: 8, range: 2 }
            ]);
        });

        it('handles maxBitsDigit = 4 (nibble-sized sections)', function () {
            const bList = Array.from({ length: 16 }, (_, i) => 15 - i);
            const result = getSections(bList, 4);
            assert.deepStrictEqual(result, [
                { bits: 4, shift: 0, start: 3, mask: 0x000F, range: 16 },
                { bits: 4, shift: 4, start: 7, mask: 0x00F0, range: 16 },
                { bits: 4, shift: 8, start: 11, mask: 0x0F00, range: 16 },
                { bits: 4, shift: 12, start: 15, mask: 0xF000, range: 16 }
            ]);
        });

        it('handles maxBitsDigit = 8 (byte-sized sections)', function () {
            const bList = Array.from({ length: 24 }, (_, i) => 23 - i);
            const result = getSections(bList, 8);
            assert.deepStrictEqual(result, [
                { bits: 8, shift: 0, start: 7, mask: 0x0000FF, range: 256 },
                { bits: 8, shift: 8, start: 15, mask: 0x00FF00, range: 256 },
                { bits: 8, shift: 16, start: 23, mask: 0xFF0000, range: 256 }
            ]);
        });

        it('handles maxBitsDigit = 16 (half-word sections)', function () {
            const bList = Array.from({ length: 32 }, (_, i) => 31 - i);
            const result = getSections(bList, 16);
            assert.strictEqual(result.length, 2);
            assert.deepStrictEqual(result[0], { bits: 16, shift: 0, start: 15, mask: 0xFFFF, range: 65536 });
            assert.deepStrictEqual(result[1], {
                bits: 16,
                shift: 16,
                start: 31,
                mask: getMaskRangeBits(31, 16),
                range: 65536
            });
        });

        it('handles maxBitsDigit = 32 (full word section)', function () {
            const bList = [31, 0];
            const result = getSections(bList, 32);
            assert.deepStrictEqual(result, [
                { bits: 32, shift: 0, start: 31, mask: -1, range: 1 }
            ]);
        });
    });

    describe('Integration with getMaskAsArray', function () {
        it('produces empty sections for mask 0', function () {
            const mask = 0;
            const bList = getMaskAsArray(mask);
            assert.deepStrictEqual(getSections(bList), []);
        });

        it('produces sections matching a sparse mask with maxBitsDigit = 8', function () {
            // Mask 0xFF00FF has bits 0..7 and 16..23 set
            const mask = 0xFF00FF;
            const bList = getMaskAsArray(mask);
            const result = getSections(bList, 8);
            assert.deepStrictEqual(result, [
                { bits: 8, shift: 0, start: 7, mask: 0x0000FF, range: 256 },
                { bits: 8, shift: 16, start: 23, mask: 0xFF0000, range: 256 }
            ]);
        });

        it('correctly sections isolated single-bit flags', function () {
            const mask = (1 << 30) | (1 << 15) | 1;
            const bList = getMaskAsArray(mask);
            const result = getSections(bList);
            assert.deepStrictEqual(result, [
                { bits: 1, shift: 0, start: 0, mask: 1, range: 2 },
                { bits: 1, shift: 15, start: 15, mask: 1 << 15, range: 2 },
                { bits: 1, shift: 30, start: 30, mask: 1 << 30, range: 2 }
            ]);
        });
    });

    describe('Structural invariants', function () {
        const testMasks = [
            0x1,
            0x7,
            0x55555555,
            0xAAAAAAAA,
            0x12345678,
            -1, // 0xFFFFFFFF
            0x80000000
        ];

        for (const mask of testMasks) {
            it(`maintains invariants for mask 0x${(mask >>> 0).toString(16)}`, function () {
                const bList = getMaskAsArray(mask);
                const maxBits = 8;
                const sections = getSections(bList, maxBits);

                let previousShift = -1;
                let combinedMask = 0;

                for (const section of sections) {
                    // start is shift + bits - 1
                    assert.strictEqual(section.start, section.shift + section.bits - 1);
                    // bits <= maxBitsDigit
                    assert.ok(section.bits <= maxBits, `bits ${section.bits} should be <= ${maxBits}`);
                    // range === (1 << bits)
                    assert.strictEqual(section.range, 1 << section.bits);
                    // mask matches getMaskRangeBits
                    assert.strictEqual(section.mask, getMaskRangeBits(section.start, section.shift));
                    // sections ordered by increasing shift
                    assert.ok(section.shift > previousShift, 'Sections should be ordered in increasing shift');
                    previousShift = section.shift;
                    // No mask overlap between sections
                    assert.strictEqual((combinedMask & section.mask), 0, 'Sections masks should not overlap');
                    combinedMask |= section.mask;
                }

                // Every bit in bList must be covered by the combined section masks
                for (const bit of bList) {
                    assert.strictEqual((combinedMask >> bit) & 1, 1, `Bit ${bit} should be covered by sections`);
                }
            });
        }
    });
});

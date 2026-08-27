import assert from 'assert';
import { sort } from '../src/utils/sort.js';

function makeRandom(n, includeNulls = true) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(Math.random() * 5); // small domain to get repeats
    const b = Math.random() < 0.2 ? null : Math.floor(Math.random() * 100);
    arr.push({ a: a, b: b });
  }
  if (includeNulls) {
    // sprinkle some explicit null objects
    arr.push({ a: null, b: 0 });
    arr.push({ a: 2, b: null });
  }
  return arr;
}

function expectedSort(arr) {
  // comparator: primary a asc (nulls last), secondary b desc (nulls first)
  return arr.slice().sort((x, y) => {
    const ax = x.a; const ay = y.a;
    // nulls last for a
    if (ax === null && ay !== null) return 1;
    if (ax !== null && ay === null) return -1;
    if (ax !== null && ay !== null) {
      if (ax !== ay) return ax - ay;
    }
    // secondary b desc, nulls first
    const bx = x.b; const by = y.b;
    if (bx === null && by !== null) return -1;
    if (bx !== null && by === null) return 1;
    if (bx !== null && by !== null) {
      if (bx !== by) return by - bx; // desc
    }
    return 0;
  });
}

describe('large random multi-field tests', function () {
  it('matches JS sort for per-field nulls and per-field orders', function () {
    for (let t = 0; t < 5; t++) {
      const arr = makeRandom(200, true);
      const expected = expectedSort(arr);

      const toSort = arr.slice();
      sort(toSort, [
        { key: x => x.a, type: 'int32', nulls: 'last' },
        { key: x => x.b, type: 'int32', order: 'desc', nulls: 'first' }
      ], { order: 'asc' });

      assert.deepStrictEqual(toSort, expected);
    }
  });
});

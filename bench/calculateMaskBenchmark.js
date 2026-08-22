import { performance } from 'perf_hooks';
import { calculateMaskIntOld, calculateMaskInt, calculateMaskIntNew} from '../sorter-utils-int.js';
import {calculateMaskNumberOld, calculateMaskNumber, calculateMaskNumberNew} from '../sorter-utils-number.js';

// Simple deterministic LCG PRNG for reproducible arrays
function createSeededRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return ((s >>> 0) / 4294967296);
  };
}

function randInt32From(rnd) {
  return (rnd() * 0x100000000) | 0;
}

function makeArray(n, dist = 'random', seed = 12345) {
  const a = new Int32Array(n);
  const rnd = createSeededRandom(seed);

  switch (dist) {
    case 'random':
      for (let i = 0; i < n; i++) a[i] = randInt32From(rnd);
      break;
    case 'zeros':
      for (let i = 0; i < n; i++) a[i] = 0;
      break;
    case 'ones':
      for (let i = 0; i < n; i++) a[i] = -1; // 0xFFFFFFFF
      break;
    case 'positivesSmall':
      for (let i = 0; i < n; i++) a[i] = (rnd() * 256) | 0;
      break;
    case 'negatives':
      for (let i = 0; i < n; i++) a[i] = -((rnd() * 256) | 0) || -1;
      break;
    case 'fewDistinct': {
      const pool = [0, 1, 2, -1, 0x7fffffff, -0x7fffffff];
      for (let i = 0; i < n; i++) a[i] = pool[(rnd() * pool.length) | 0];
      break;
    }
    case 'increasing':
      for (let i = 0; i < n; i++) a[i] = i | 0;
      break;
    case 'decreasing':
      for (let i = 0; i < n; i++) a[i] = (n - i) | 0;
      break;
    default:
      for (let i = 0; i < n; i++) a[i] = randInt32From(rnd);
  }
  return a;
}

function benchFn(fn, arr, repeats) {
  // warm-up
  fn(arr, 0, arr.length);

  const t0 = performance.now();
  for (let r = 0; r < repeats; r++) {
    fn(arr, 0, arr.length);
  }
  const t1 = performance.now();
  return (t1 - t0) / repeats;
}

function runScenario(n, repeats, dist) {
  const seed = 1234567; // keep reproducible across runs
  const arr = makeArray(n, dist, seed);

  // Integer variants
  const res1 = calculateMaskIntOld(arr, 0, arr.length);
  const res2 = calculateMaskIntNew(arr, 0, arr.length);
  const res3 = calculateMaskInt(arr, 0, arr.length);
  const intEqual = (res1 === res2) && (res1 === res3);

  if (!intEqual) {
    console.log(`MISMATCH for size ${n} dist ${dist}: int v1=${res1} v2=${res2} v3=${res3}`);
    console.log('Sample:', Array.from(arr.slice(0, 10)));
    return { n, dist, equal: false, res1, res2, res3 };
  }

  // Number variants
  const resn1 = calculateMaskNumberOld(arr, 0, arr.length);
  const resn2 = calculateMaskNumberNew(arr, 0, arr.length);
  const resn3 = calculateMaskNumber(arr, 0, arr.length);
  const numEqual = (resn1[0] === resn2[0]) && (resn1[1] === resn2[1]) && (resn1[0] === resn3[0]) && (resn1[1] === resn3[1]);

  if (!numEqual) {
    console.log(`MISMATCH for size ${n} dist ${dist}: number old=[${resn1}] new=[${resn2}] unroll=[${resn3}]`);
    console.log('Sample:', Array.from(arr.slice(0, 10)));
    return { n, dist, equal: false, resn1, resn2, resn3 };
  }


  const t1 = benchFn(calculateMaskIntOld, arr, repeats);
  const t2 = benchFn(calculateMaskIntNew, arr, repeats);
  const t3 = benchFn(calculateMaskInt, arr, repeats);

  const t4 = benchFn(calculateMaskNumberOld, arr, repeats);
  const t5 = benchFn(calculateMaskNumberNew, arr, repeats);
  const t6 = benchFn(calculateMaskNumber, arr, repeats);

  console.log(`${n} ${dist}: OK mask=${res1}  v1 ${t1.toFixed(3)}ms  v2 ${t2.toFixed(3)}ms  v3 ${t3.toFixed(3)}ms  ratio v2/v1 ${(t2 / t1).toFixed(3)} v3/v1 ${(t3 / t1).toFixed(3)}  numOld ${t4.toFixed(3)}ms numNew ${t5.toFixed(3)}ms numUnroll ${t6.toFixed(3)}ms`);
  return { n, dist, equal: true, res1, res2, res3, resn1, resn2, resn3, t1, t2, t3, t4, t5, t6 };
}

async function main() {
  const scenarios = [
    { n: 1000, repeats: 20000 },
    { n: 10000, repeats: 5000 },
    { n: 1000000, repeats: 100 }
  ];

  const dists = ['random', 'zeros', 'ones', 'positivesSmall', 'negatives', 'fewDistinct', 'increasing', 'decreasing'];

  const results = [];
  for (const s of scenarios) {
    for (const dist of dists) {
      // small pause
      await new Promise(r => setTimeout(r, 10));
      results.push(runScenario(s.n, s.repeats, dist));
    }
  }

  console.log('\nSummary:');
  for (const r of results) {
    if (!r) continue;
    if (r.equal === false) {
      console.log(`${r.n} ${r.dist}: MISMATCH v1=${r.res1} v2=${r.res2} v3=${r.res3}`);
    } else {
      console.log(`${r.n} ${r.dist}: OK mask=${r.res1} t1=${(r.t1||0).toFixed(3)}ms t2=${(r.t2||0).toFixed(3)}ms t3=${(r.t3||0).toFixed(3)}ms t4=${(r.t4||0).toFixed(3)}ms t5=${(r.t5||0).toFixed(3)}ms t6=${(r.t6||0).toFixed(3)}ms`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(2); });

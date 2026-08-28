// Simple benchmark harness comparing native Array.sort, fast-sort, timsort, and local bitmask sorter
// Usage:
//   npm install
//   npm run build
//   npm install --save-dev fast-sort@^3.4.1 timsort@^0.3.0
//   node benchmarks/benchmark.cjs

const { performance } = require('perf_hooks');
const path = require('path');

const VERIFY_SORT = process.env.VERIFY_SORT !== 'false';

function median(arr){
  const s = arr.slice().sort((a,b)=>a-b);
  const mid = Math.floor(s.length/2);
  return s.length%2 ? s[mid] : (s[mid-1]+s[mid])/2;
}

function timeFn(fn){
  const start = performance.now();
  const result = fn();
  return { elapsed: performance.now()-start, result };
}

function generateRandom(n, max=1e6){
  const a = new Array(n);
  for(let i=0;i<n;i++) a[i]=Math.floor(Math.random()*max);
  return a;
}

function assertSortedAsc(name, arr, keyFn){
  if(!VERIFY_SORT || !arr || arr.length < 2) return;
  const values = keyFn ? arr.map(keyFn) : arr.slice();
  for(let i=1;i<values.length;i++){
    if(values[i-1] > values[i]){
      throw new Error(`${name} produced an incorrect order at index ${i}: ${values[i-1]} > ${values[i]}`);
    }
  }
}

async function main(){
  // Try to require local sorter (project root)
  let localSorter = null;
  // Prefer ESM build (dist/index.esm.js) because this project uses "type": "module"
  const esmPath = path.join(__dirname,'..','dist','index.esm.js');
  try{
    const { pathToFileURL } = require('url');
    const mod = await import(pathToFileURL(esmPath).href);
    localSorter = mod; // keep module namespace so named exports are available
    if(localSorter) console.log('Loaded local sorter (module namespace) from ESM build:', esmPath);
  }catch(e){
    try{
      const cjsPath = path.join(__dirname,'..','dist','index.cjs.js');
      localSorter = require(cjsPath);
      if(localSorter) console.log('Loaded local sorter from CJS build:', cjsPath);
    }catch(e2){
      try{
        localSorter = require(path.join(__dirname,'..'));
        if(localSorter) console.log('Loaded local sorter from package root');
      }catch(e3){
        console.error('Could not require/import local sorter. Errors:', e, e2, e3);
      }
    }
  }

  let fastSort = null;
  try{ fastSort = require('fast-sort'); }catch(e){ console.warn('fast-sort not installed. Install with: npm install --save-dev fast-sort'); }

  let timsort = null;
  try{ timsort = require('timsort'); }catch(e){ console.warn('timsort not installed. Install with: npm --save-dev timsort'); }

  const util = require('util');
  if(localSorter){
    console.log('Local module typeof:', typeof localSorter);
    console.log('Local module inspect:', util.inspect(localSorter, {showHidden:true, depth:2}));
    try{ console.log('localModule keys:', Object.keys(localSorter)); }catch(e){ console.log('keys failed', e); }
  }

  // helper to retrieve named export from module or its default
  function getExport(mod, name){
    if(!mod) return undefined;
    if(mod[name] !== undefined) return mod[name];
    if(mod.default && mod.default[name] !== undefined) return mod.default[name];
    return undefined;
  }

  const integerSorters = [];
  const objectSorters = [];
  integerSorters.push({name: 'native', fn: (arr)=>arr.sort((a,b)=>a-b)});
  objectSorters.push({name: 'native', fn: (arr, keyFn)=>arr.sort((a,b)=>keyFn(a)-keyFn(b))});
  if(fastSort) integerSorters.push({name:'fast-sort', fn: (arr)=>fastSort.sort(arr).asc()});
  if(fastSort) objectSorters.push({name:'fast-sort', fn: (arr, keyFn)=>fastSort.sort(arr).asc(keyFn)});
  if(timsort) integerSorters.push({name:'timsort', fn: (arr)=>{
      const compare = (a,b) => a - b;
      return timsort.TimSort ? timsort.TimSort.sort(arr, compare) : timsort.sort(arr, compare);
  }});
  if(timsort) objectSorters.push({name:'timsort', fn: (arr, keyFn)=>{
      const compare = (a,b) => keyFn(a) - keyFn(b);
      return timsort.TimSort ? timsort.TimSort.sort(arr, compare) : timsort.sort(arr, compare);
  }});
  if(localSorter){
      const fnInt32 = getExport(localSorter, 'sortInt32');
      const fnFloat64 = getExport(localSorter, 'sortFloat64');
      const fnObjInt32 = getExport(localSorter, 'sortObjectByInt32Key');
      const fnObjFloat64 = getExport(localSorter, 'sortObjectByFloat64Key');

      if(typeof fnInt32 === 'function') integerSorters.push({name:'bitmask-sort-int32', fn:(arr)=>{ fnInt32(arr); return arr; }});
      if(typeof fnFloat64 === 'function') integerSorters.push({name:'bitmask-sort-float64', fn:(arr)=>{ fnFloat64(arr); return arr; }});
      if(typeof fnObjInt32 === 'function') objectSorters.push({name:'bitmask-sort-obj-int32', fn:(arr, keyFn)=>{  fnObjInt32(arr, keyFn); return arr; }});
      if(typeof fnObjFloat64 === 'function') objectSorters.push({name:'bitmask-sort-obj-float64', fn:(arr, keyFn)=>{ fnObjFloat64(arr, keyFn); return arr; }});
    }

  const sizes = [100, 1000, 10000, 100000, 1000000];
  const runs = 10;

  for(const n of sizes){
    console.log(`\nBenchmark: integers n=${n} size=${n} runs=${runs}`);
    const base = generateRandom(n);
    for(const s of integerSorters){
      const times = [];
      for(let r=0;r<runs;r++){
        const arr = base.slice();
        const { elapsed, result } = timeFn(() => s.fn(arr));
        if(VERIFY_SORT) assertSortedAsc(s.name, result === undefined ? arr : result);
        times.push(elapsed);
      }
      console.log(`${s.name.padEnd(24)} median: ${median(times).toFixed(3).padStart(9)} ms`);
    }
  }
  for(const n of sizes){
    console.log(`\nBenchmark: objects n=${n} size=${n} runs=${runs}`);
    const base = generateRandom(n).map(x=>({value:x}));
    for(const s of objectSorters){
      const times = [];
      for(let r=0;r<runs;r++){
        const arr = base.slice();
        const { elapsed, result } = timeFn(() => s.fn(arr, x => x.value));
        if(VERIFY_SORT) assertSortedAsc(s.name, result === undefined ? arr : result, x => x.value);
        times.push(elapsed);
      }
      console.log(`${s.name.padEnd(24)} median: ${median(times).toFixed(3).padStart(9)} ms`);
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });

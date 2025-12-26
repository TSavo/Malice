/**
 * Benchmark to compare Map vs Array performance for sequential numeric IDs
 * as used in Malice ObjectCache.
 */

function benchmark() {
  const count = 50000;
  const iterations = 1000;
  const ids = Array.from({ length: count }, (_, i) => i + 1);

  // 1. Map Setup
  const map = new Map<number, any>();
  for (const id of ids) {
    map.set(id, { id, data: 'dummy' });
  }

  // 2. Array Setup
  const arr: any[] = [];
  for (const id of ids) {
    arr[id] = { id, data: 'dummy' };
  }

  console.log(
    `Benchmarking ${count} objects over ${iterations} iterations...\n`,
  );

  // Map Benchmark
  const mapStart = performance.now();
  let _mapCheck = 0;
  for (let i = 0; i < iterations; i++) {
    for (const id of ids) {
      const obj = map.get(id);
      if (obj) _mapCheck++;
    }
  }
  const mapEnd = performance.now();
  console.log(`Map.get():    ${(mapEnd - mapStart).toFixed(2)}ms`);

  // Array Benchmark
  const arrStart = performance.now();
  let _arrCheck = 0;
  for (let i = 0; i < iterations; i++) {
    for (const id of ids) {
      const obj = arr[id];
      if (obj) _arrCheck++;
    }
  }
  const arrEnd = performance.now();
  console.log(`Array[index]: ${(arrEnd - arrStart).toFixed(2)}ms`);

  const improvement = ((mapEnd - mapStart) / (arrEnd - arrStart)).toFixed(2);
  console.log(
    `\nArray is ~${improvement}x faster than Map for sequential IDs.`,
  );
}

benchmark();

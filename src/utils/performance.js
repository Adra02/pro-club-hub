// Utility per performance monitoring
export class PerformanceMonitor {
  static timings = new Map();

  static startTiming(key) {
    this.timings.set(key, {
      start: performance.now(),
      end: null,
      duration: null
    });
  }

  static endTiming(key) {
    const timing = this.timings.get(key);
    if (timing) {
      timing.end = performance.now();
      timing.duration = timing.end - timing.start;
      
      console.log(`⏱️ ${key}: ${timing.duration.toFixed(2)}ms`);
      
      // Log solo se troppo lento
      if (timing.duration > 1000) {
        console.warn(`⚠️ ${key} took ${timing.duration.toFixed(2)}ms (slow)`);
      }
    }
  }

  static measureAsync(key, asyncFn) {
    this.startTiming(key);
    return asyncFn().finally(() => this.endTiming(key));
  }
}

// Memoization helper
export function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Batch updates helper
export function batchUpdates(callback) {
  // In React Native, potresti usare InteractionManager
  setTimeout(callback, 0);
}
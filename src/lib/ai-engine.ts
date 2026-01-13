// ---------------------------------------------------------
// ?? SMART PERFORMANCE UTILITIES
// ---------------------------------------------------------

// Debounce utility for search inputs
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// Throttle utility for frequent updates
export const throttle = <T extends (...args: any[]) => any>(fn: T, limit: number) => {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Smart memoization with LRU cache
export class LRUCache<K, V> {
    private cache = new Map<K, V>();
    constructor(private maxSize: number = 100) { }

    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.size >= this.maxSize) {
            // Delete oldest entry
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    clear(): void {
        this.cache.clear();
    }
}

// ---------------------------------------------------------
// ?? ADVANCED AI & DSA ENGINE
// ---------------------------------------------------------

// ?? TRIE DATA STRUCTURE - O(m) search where m = word length
export class TrieNode {
    children: Map<string, TrieNode> = new Map();
    isEndOfWord: boolean = false;
    data: any = null;
    frequency: number = 0;
}

export class Trie {
    root: TrieNode = new TrieNode();

    // O(m) insertion
    insert(word: string, data: any = null): void {
        let node = this.root;
        for (const char of word.toLowerCase()) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
        }
        node.isEndOfWord = true;
        node.data = data;
        node.frequency++;
    }

    // O(m) prefix search - returns all words with given prefix
    searchPrefix(prefix: string, limit: number = 10): any[] {
        let node = this.root;
        for (const char of prefix.toLowerCase()) {
            if (!node.children.has(char)) return [];
            node = node.children.get(char)!;
        }
        return this._collectWords(node, prefix, [], limit);
    }

    private _collectWords(node: TrieNode, prefix: string, results: any[], limit: number): any[] {
        if (results.length >= limit) return results;
        if (node.isEndOfWord) {
            results.push({ word: prefix, data: node.data, frequency: node.frequency });
        }
        for (const [char, child] of node.children) {
            this._collectWords(child, prefix + char, results, limit);
        }
        return results;
    }
}

// ?? PRIORITY QUEUE - O(log n) operations for alerts/notifications
export class PriorityQueue<T> {
    private heap: { priority: number; value: T }[] = [];

    enqueue(value: T, priority: number): void {
        this.heap.push({ priority, value });
        this._bubbleUp(this.heap.length - 1);
    }

    dequeue(): T | undefined {
        if (this.heap.length === 0) return undefined;
        const result = this.heap[0].value;
        const last = this.heap.pop();
        if (this.heap.length > 0 && last) {
            this.heap[0] = last;
            this._bubbleDown(0);
        }
        return result;
    }

    peek(): T | undefined {
        return this.heap[0]?.value;
    }

    size(): number {
        return this.heap.length;
    }

    private _bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }

    private _bubbleDown(index: number): void {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < this.heap.length && this.heap[leftChild].priority < this.heap[smallest].priority) {
                smallest = leftChild;
            }
            if (rightChild < this.heap.length && this.heap[rightChild].priority < this.heap[smallest].priority) {
                smallest = rightChild;
            }
            if (smallest === index) break;
            [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
            index = smallest;
        }
    }
}

// ?? BLOOM FILTER - O(k) probabilistic existence check
export class BloomFilter {
    private bitArray: boolean[];
    private hashFunctions: number;

    constructor(size: number = 1000, hashFunctions: number = 3) {
        this.bitArray = new Array(size).fill(false);
        this.hashFunctions = hashFunctions;
    }

    private _hash(str: string, seed: number): number {
        let hash = seed;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
        }
        return Math.abs(hash) % this.bitArray.length;
    }

    add(item: string): void {
        for (let i = 0; i < this.hashFunctions; i++) {
            const index = this._hash(item, i * 31);
            this.bitArray[index] = true;
        }
    }

    mightContain(item: string): boolean {
        for (let i = 0; i < this.hashFunctions; i++) {
            const index = this._hash(item, i * 31);
            if (!this.bitArray[index]) return false;
        }
        return true;
    }
}

// ?? AI PREDICTION ENGINE
export const AIEngine = {
    // Moving Average for trend prediction - O(n)
    calculateMovingAverage: (data: number[], period: number = 7): number[] => {
        const result: number[] = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    },

    // Exponential Smoothing for sales prediction - O(n)
    exponentialSmoothing: (data: number[], alpha: number = 0.3): number => {
        if (data.length === 0) return 0;
        let forecast = data[0];
        for (let i = 1; i < data.length; i++) {
            forecast = alpha * data[i] + (1 - alpha) * forecast;
        }
        return forecast;
    },

    // Linear Regression for price optimization - O(n)
    linearRegression: (x: number[], y: number[]): { slope: number; intercept: number; predict: (val: number) => number } => {
        const n = x.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumXX += x[i] * x[i];
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
        const intercept = (sumY - slope * sumX) / n || 0;
        return {
            slope,
            intercept,
            predict: (val: number) => slope * val + intercept
        };
    },

    // Anomaly Detection using Z-Score - O(n)
    detectAnomalies: (data: number[], threshold: number = 2): number[] => {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
        return data.map((val, idx) => Math.abs((val - mean) / std) > threshold ? idx : -1).filter(i => i !== -1);
    },

    // Seasonal Decomposition for pattern recognition
    seasonalPattern: (data: number[], seasonLength: number = 7): { trend: number[]; seasonal: number[]; residual: number[] } => {
        const trend = AIEngine.calculateMovingAverage(data, seasonLength);
        const seasonal: number[] = [];
        const residual: number[] = [];

        for (let i = 0; i < data.length; i++) {
            const trendVal = trend[Math.max(0, i - Math.floor(seasonLength / 2))] || data[i];
            seasonal.push(data[i] - trendVal);
            residual.push(data[i] - trendVal - (seasonal[i % seasonLength] || 0));
        }
        return { trend, seasonal, residual };
    },

    // Product Recommendation using Collaborative Filtering - O(n*m)
    getRecommendations: (purchases: string[][], currentCart: string[]): string[] => {
        const coOccurrence = new Map<string, Map<string, number>>();

        // Build co-occurrence matrix
        purchases.forEach(basket => {
            basket.forEach(item1 => {
                if (!coOccurrence.has(item1)) coOccurrence.set(item1, new Map());
                basket.forEach(item2 => {
                    if (item1 !== item2) {
                        const count = coOccurrence.get(item1)!.get(item2) || 0;
                        coOccurrence.get(item1)!.set(item2, count + 1);
                    }
                });
            });
        });

        // Get recommendations based on current cart
        const scores = new Map<string, number>();
        currentCart.forEach(item => {
            const related = coOccurrence.get(item);
            if (related) {
                related.forEach((count, relatedItem) => {
                    if (!currentCart.includes(relatedItem)) {
                        scores.set(relatedItem, (scores.get(relatedItem) || 0) + count);
                    }
                });
            }
        });

        return Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([item]) => item);
    },

    // Smart Price Suggestion based on market analysis
    suggestPrice: (cost: number, competitorPrices: number[], demandLevel: 'low' | 'medium' | 'high'): { min: number; optimal: number; max: number } => {
        const avgCompetitor = competitorPrices.length > 0
            ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
            : cost * 1.3;

        const demandMultiplier = { low: 0.9, medium: 1.0, high: 1.15 }[demandLevel];
        const minMargin = 1.1; // 10% minimum margin
        const optimalMargin = 1.25; // 25% optimal margin
        const maxMargin = 1.5; // 50% max margin

        return {
            min: Math.max(cost * minMargin, avgCompetitor * 0.85) * demandMultiplier,
            optimal: Math.max(cost * optimalMargin, avgCompetitor) * demandMultiplier,
            max: cost * maxMargin * demandMultiplier
        };
    },

    // Inventory Reorder Point Calculation
    calculateReorderPoint: (avgDailySales: number, leadTimeDays: number, safetyStock: number = 0): number => {
        return Math.ceil(avgDailySales * leadTimeDays + safetyStock);
    },

    // ABC Analysis for inventory classification - O(n log n)
    abcAnalysis: (items: { id: string; value: number }[]): { A: string[]; B: string[]; C: string[] } => {
        const sorted = [...items].sort((a, b) => b.value - a.value);
        const total = items.reduce((sum, item) => sum + item.value, 0);

        let cumulative = 0;
        const result = { A: [] as string[], B: [] as string[], C: [] as string[] };

        for (const item of sorted) {
            cumulative += item.value;
            const percentage = cumulative / total;
            if (percentage <= 0.7) result.A.push(item.id);
            else if (percentage <= 0.9) result.B.push(item.id);
            else result.C.push(item.id);
        }
        return result;
    }
};

// ?? FUZZY SEARCH with Levenshtein Distance - O(m*n)
export const fuzzySearch = (query: string, items: string[], maxDistance: number = 2): string[] => {
    const levenshtein = (a: string, b: string): number => {
        const matrix: number[][] = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                matrix[i][j] = b[i - 1] === a[j - 1]
                    ? matrix[i - 1][j - 1]
                    : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
        return matrix[b.length][a.length];
    };

    return items
        .map(item => ({ item, distance: levenshtein(query.toLowerCase(), item.toLowerCase()) }))
        .filter(r => r.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .map(r => r.item);
};

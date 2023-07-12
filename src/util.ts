export function toHex(num: number, byteSize = 1) {
    let res = num.toString(16).padStart(byteSize * 2, '0');
    if (res.length % 2 == 1) res = '0' + res;
    return res;
}

export function byteSize(num: number): number {
    return toHex(num).length / 2;
}

export type Iterableify<T> = { [K in keyof T]: Iterable<T[K]> };
/**
 * Stolen from https://dev.to/chrismilson/zip-iterator-in-typescript-ldm
 *
 * @remarks
 * Some common usages:
 * - Convert generator to array:
 *  ```ts
 * const firstWay = [...zip(a, b)];
 * const secondWay = Array.from(zip(a, b));
 * ```
 *
 * - Map element:
 * ```ts
 * const mappedArray = Array.from(zip(a, b), mapFn);
 * ```
 */
export function* zip<T extends unknown[]>(...toZip: Iterableify<T>): Generator<T> {
    const iterators = toZip.map((i) => i[Symbol.iterator]());
    while (true) {
        const results = iterators.map((i) => i.next());
        if (results.some(({ done }) => done)) {
            break;
        }
        yield results.map(({ value }) => value as unknown) as T;
    }
}

export function prefixSum(arr: number[]): number[] {
    const res = [];
    let last = 0;
    for (const cur of arr) {
        last += cur;
        res.push(last);
    }
    return res;
}

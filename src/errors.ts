export function assert(cond: boolean, msg?: string): asserts cond is true {
    if (!cond) {
        throw new Error(msg ?? 'assertion error');
    }
}

export function assert(cond: boolean, msg?: string): asserts cond is true {
    if (!cond) {
        throw new Error(msg ?? 'assertion error');
    }
}

export function assertDefined<T>(value: T | null | undefined, msg?: string): asserts value is T {
    assert(value != null, msg);
}

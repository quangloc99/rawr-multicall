import { LabeledAddress } from './Address';

export function assert(cond: boolean, msg?: string | (() => Error | never)): asserts cond is true {
    if (cond) return;
    if (typeof msg === 'function') throw msg();
    throw new AssertionError(msg);
}

export function assertDefined<T>(value: T | null | undefined, msg?: string | (() => Error | never)): T {
    assert(value != null, msg);
    return value as T;
}

export class RawMulticallError extends Error {
    constructor(...params: Parameters<ErrorConstructor>) {
        super(...params);

        Object.setPrototypeOf(this, this.constructor.prototype as object);
    }
}

export class AssertionError extends RawMulticallError {
    constructor(msg: string = 'assertion error', params?: ErrorOptions) {
        super(msg, params);
    }
}

export class NoPredeployContractError extends RawMulticallError {
    constructor(
        readonly label: LabeledAddress['label'],
        params?: ErrorOptions
    ) {
        super(`There is no predeploy contract with label ${String(label)}`, params);
    }
}

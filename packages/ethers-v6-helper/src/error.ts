import { Bytes } from '@raw-multicall/core';

export class NoFragmentFoundError extends Error {
    constructor(
        readonly data: Bytes,
        message: string = 'No fragment found for error',
        options?: ErrorOptions
    ) {
        super(message, options);

        Object.setPrototypeOf(this, NoFragmentFoundError.prototype);
    }
}

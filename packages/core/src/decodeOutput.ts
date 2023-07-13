/**
 * See {@link ../OUTPUT_FORMAT.md} for the output format.
 */

import { Bytes, ByteStream, createByteStream, add0x } from './bytes';
import { RawResult, Result, ResultsOfCalls } from './Result';
import { LENGTH_SIZE_bits } from './constants';
import { Call } from './Call';
import { zip } from './util';

export function decodeRawResult(data: Bytes): RawResult[] {
    return Array.from(decodeRawResultStream(createByteStream(data)));
}

export function* decodeRawResultStream(stream: ByteStream): Generator<RawResult> {
    while (stream.hasMore()) {
        const successAndLength = parseInt(stream.next(4), 16);
        const success = successAndLength >>> (LENGTH_SIZE_bits - 1);
        const dataLength = successAndLength ^ (success << (LENGTH_SIZE_bits - 1));
        const data = add0x(stream.next(dataLength));
        yield { success: !!success, data };
    }
}

export function decodeResult<Calls extends readonly Call<unknown, unknown>[]>(
    calls: Calls,
    data: Bytes
): ResultsOfCalls<Calls>;
export function decodeResult(calls: readonly Call<unknown, unknown>[], data: Bytes): Result<unknown, unknown>[] {
    return Array.from(zip(calls, decodeRawResult(data)), ([call, { success, data }]) =>
        success
            ? {
                  success: true,
                  result: call.decodeResult(data),
              }
            : {
                  success: false,
                  error: call.decodeError(data),
              }
    );
}

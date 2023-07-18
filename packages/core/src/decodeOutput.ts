/**
 * See {@link ../OUTPUT_FORMAT.md} for the output format.
 */

import { Bytes, ByteStream, createByteStream, toBytes, bytesToNumber } from './Bytes';
import { RawResult, Result, ResultsOfCalls } from './Result';
import { LENGTH_SIZE_bits } from './constants';
import { Call } from './Call';
import { zip } from './util';

export function decodeRawResult(data: Bytes | string): RawResult[] {
    return Array.from(decodeRawResultStream(createByteStream(toBytes(data))));
}

export function* decodeRawResultStream(stream: ByteStream): Generator<RawResult> {
    while (stream.hasMore()) {
        const successAndLength = bytesToNumber(stream.next(4));
        const success = successAndLength >>> (LENGTH_SIZE_bits - 1);
        const dataLength = successAndLength ^ (success << (LENGTH_SIZE_bits - 1));
        const data = stream.next(dataLength);
        yield { success: !!success, data };
    }
}

export function decodeResult<Calls extends readonly Call<unknown, unknown>[]>(
    calls: Calls,
    data: Bytes | string
): ResultsOfCalls<Calls>;

export function decodeResult(
    calls: readonly Call<unknown, unknown>[],
    data: Bytes | string
): Result<unknown, unknown>[] {
    return Array.from(zip(calls, decodeRawResult(data)), ([call, { success, data }]) =>
        call.decodeOutput(success, data)
    );
}

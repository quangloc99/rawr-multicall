/**
 * See {@link ../OUTPUT_FORMAT.md} for the output format.
 */

import { Bytes, ByteStream, createByteStream } from './bytes';
import { RawResult } from './Result';
import { LENGTH_SIZE_bits } from './constants';

export function decodeData(data: Bytes): RawResult[] {
    return Array.from(decodeDataStream(createByteStream(data)));
}

export function* decodeDataStream(stream: ByteStream): Generator<RawResult> {
    while (stream.hasMore()) {
        const successAndLength = parseInt(stream.next(4), 16);
        const success = successAndLength >>> (LENGTH_SIZE_bits - 1);
        const dataLength = successAndLength ^ (success << (LENGTH_SIZE_bits - 1));
        const data = stream.next(dataLength);
        yield { success: !!success, data };
    }
}

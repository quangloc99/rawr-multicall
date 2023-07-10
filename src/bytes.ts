import { toHex } from './util';
import { assert } from './errors';

export type Bytes = string;
export type ByteStream = {
    hasMore(): boolean;
    next(byteSize: number): Bytes;
};

export function strip0x(bytes: Bytes) {
    if (bytes.startsWith('0x')) return bytes.slice(2);
    return bytes;
}

export function add0x(bytes: Bytes) {
    if (bytes.startsWith('0x')) return bytes;
    return '0x' + bytes;
}

export function byteLength(bytes: Bytes) {
    const len = strip0x(bytes).length;
    assert(len % 2 == 0, `'${bytes}' is not a valid bytes sequence.`);
    return len / 2;
}

export function concat(...params: Bytes[] | [Bytes[]]) {
    return params.flat().map(strip0x).join('');
}

export function byte(num: number) {
    return toHex(num, 1);
}

export function ensureSize(bytes: Bytes, size: number) {
    assert(byteLength(bytes) == size * 2, `'${bytes}' must have ${size} byte(s)`);
    return bytes;
}

export function createByteStream(bytes: Bytes): ByteStream {
    bytes = strip0x(bytes);
    let currentPos = 0; // not in bytes, but in character
    return {
        hasMore: () => currentPos < bytes.length,
        next(len: number): Bytes {
            len += len;
            assert(currentPos + len <= bytes.length);
            const res = bytes.slice(currentPos, currentPos + len);
            currentPos += len;
            return res;
        },
    };
}

import { bytesToHex, hexToBytes } from 'ethereum-cryptography/utils';
import { assert } from './errors';
import { toHex } from './util';
export { hexToBytes, utf8ToBytes, equalsBytes, bytesToHex } from 'ethereum-cryptography/utils';

export type Bytes = Uint8Array;

export const EMPTY_BYTES = new Uint8Array([]);

export function toBytes(value: string | Bytes): Bytes {
    if (typeof value === 'string') return hexToBytes(value);
    return value;
}

export function bytesToHexWith0x(bytes: Bytes) {
    return `0x${bytesToHex(bytes)}`;
}

export function byte(num: number): Bytes {
    return new Uint8Array([num]);
}

export function numberToBytes(num: number, byteSize?: number): Bytes {
    return hexToBytes(toHex(num, byteSize));
}

/**
 * Reimplement concatBytes instead of the one from ethereum-cryptography
 * because of the spread operator limit.
 */
export function concatBytes(arrays: Uint8Array[]): Uint8Array {
    const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
    let pad = 0;
    for (const a of arrays) {
        r.set(a, pad);
        pad += a.length;
    }
    return r;
}

export function bytesToNumber(bytes: Bytes): number {
    let res = 0;
    for (const elm of bytes) {
        // we don't use bit-shifting as it will wrap the number around a SIGNED 32-bit integer
        res = res * 256 + elm;
    }
    return res;
}

export type ByteStream = {
    hasMore(): boolean;
    next(byteSize: number): Bytes;
};

export function createByteStream(bytes: Bytes): ByteStream {
    let currentPos: number = 0;
    return {
        hasMore: () => currentPos < bytes.length,
        next: (byteSize: number) => {
            assert(byteSize + currentPos <= bytes.length);
            const oldPos = currentPos;
            currentPos += byteSize;
            return bytes.slice(oldPos, currentPos);
        },
    };
}

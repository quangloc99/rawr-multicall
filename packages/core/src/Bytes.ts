import { toHex } from './util';
import { assert } from './errors';

export type ByteStream = {
    hasMore(): boolean;
    next(byteSize: number): Bytes;
};

export class Bytes {
    readonly data: string;
    constructor(hexString: string) {
        if (hexString.startsWith('0x')) hexString = hexString.slice(2);
        assert(hexString.length % 2 == 0, 'hex string must have even size');
        this.data = hexString.toLowerCase();
    }

    static EMPTY = new Bytes('');

    static from(hexString: string): Bytes;
    static from(bytes: Bytes): Bytes;
    static from(params: string | Bytes): Bytes;
    static from(params: string | Bytes): Bytes {
        if (typeof params == 'string') return new Bytes(params);
        return params;
    }

    static byte(value: number): Bytes {
        assert(0 <= value && value < 256);
        return new Bytes(toHex(value, 1));
    }

    static fromNumber(value: number, byteSize?: number): Bytes {
        return new Bytes(toHex(value, byteSize));
    }

    static concat(...params: Bytes[] | [Bytes[]]) {
        return new Bytes(
            params
                .flat()
                .map(({ data }) => data)
                .join('')
        );
    }

    get length() {
        return this.data.length >>> 1;
    }

    add0x(): string {
        return `0x${this.data}`;
    }

    toString(): string {
        return this.add0x();
    }

    slice(startByteIndex: number, endByteIndex?: number): Bytes {
        const start = startByteIndex * 2;
        const end = endByteIndex ? endByteIndex * 2 : this.data.length;
        return new Bytes(this.data.slice(start, end));
    }

    createStream() {
        let currentPos = 0; // not in bytes, but in character
        return {
            get currentPos() {
                return currentPos;
            },
            hasMore: () => currentPos < this.length,
            next: (len: number): Bytes => {
                assert(currentPos + len <= this.length);
                const oldPos = currentPos;
                currentPos += len;
                return this.slice(oldPos, currentPos);
            },
        };
    }

    includes(bytes: Bytes | string): boolean {
        const normalizedBytes = Bytes.from(bytes).data;
        return this.data.includes(normalizedBytes);
    }
}

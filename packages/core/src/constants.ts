import { type Bytes } from './Bytes';
export const WORD_SIZE_bytes = 32;
export const SIGN_BIT = WORD_SIZE_bytes * 8 - 1;
export const LENGTH_SIZE_bytes = 4; // how many byte to store array length.
export const LENGTH_SIZE_bits = LENGTH_SIZE_bytes * 8;
export const LENGTH_SHIFT = (32 - LENGTH_SIZE_bytes) * 8; // how much to shift to convert 32 bytes to LENGTH_SIZE bytes
export const FREE_MEMORY_START = 0x80;
export const AddressZero: Bytes = new Uint8Array(20);

export const SIGN_BIT = 256 - 1;
export const LENGTH_SIZE_bytes = 4; // how many byte to store array length.
export const LENGTH_SIZE_bits = LENGTH_SIZE_bytes * 8;
export const LENGTH_SHIFT = (32 - LENGTH_SIZE_bytes) * 8; // how much to shift to convert 32 bytes to LENGTH_SIZE bytes
export const FREE_MEMORY_START = 0x80;

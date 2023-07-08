export function toHex(num: number, byteSize = 1) {
    return num.toString().padStart(byteSize * 2, '0');
}

export function byteSize(num: number): number {
    return toHex(num).length / 2;
}

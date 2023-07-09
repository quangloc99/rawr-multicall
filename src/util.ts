export function toHex(num: number, byteSize = 1) {
    let res = num.toString(16).padStart(byteSize * 2, '0');
    if (res.length % 2 == 1) res = '0' + res;
    return res;
}

export function byteSize(num: number): number {
    return toHex(num).length / 2;
}

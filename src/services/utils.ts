// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const chunk = <T>(arr: T[], size: number): T[][] =>
    [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));

export const range = (start: number, stop: number, step = 1): number[] =>
    Array(Math.ceil((stop - start) / step) + 1)
        .fill(start)
        .map((x, y) => x + y * step);

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function bytesToHex(bytes: Uint8Array) {
    return (
        '0x' +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    );
}

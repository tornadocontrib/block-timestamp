"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.chunk = void 0;
exports.sleep = sleep;
exports.bytesToHex = bytesToHex;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const chunk = (arr, size) => [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));
exports.chunk = chunk;
const range = (start, stop, step = 1) => Array(Math.ceil((stop - start) / step) + 1)
    .fill(start)
    .map((x, y) => x + y * step);
exports.range = range;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function bytesToHex(bytes) {
    return ('0x' +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''));
}

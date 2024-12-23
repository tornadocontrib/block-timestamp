"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newError = newError;
function newError(type, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
err) {
    return {
        type,
        timestamp: Math.floor(Date.now() / 1000),
        message: err.message,
        stack: err.stack,
    };
}

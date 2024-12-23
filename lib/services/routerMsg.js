"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
exports.resolveMessages = resolveMessages;
/* eslint-disable  @typescript-eslint/no-explicit-any */
/**
 * Send and receive messages from worker to main thread
 */
const process_1 = __importDefault(require("process"));
const crypto_1 = require("crypto");
const utils_1 = require("./utils");
function sendMessage(router, msg) {
    const msgId = (0, utils_1.bytesToHex)(crypto_1.webcrypto.getRandomValues(new Uint8Array(8)));
    return new Promise((resolve, reject) => {
        if (!process_1.default.send) {
            reject(new Error('Not worker'));
            return;
        }
        const msgJson = JSON.parse(JSON.stringify(msg));
        msgJson.msgId = msgId;
        process_1.default.send(msgJson);
        router.messages.push({
            msgId,
            resolve,
            reject,
            resolved: false,
        });
    });
}
function resolveMessages(router) {
    process_1.default.on('message', (msg) => {
        const message = router.messages.find((w) => w.msgId === msg.msgId);
        if (!message) {
            return;
        }
        const msgJson = JSON.parse(JSON.stringify(msg));
        delete msgJson.msgId;
        message.resolve(msgJson);
        message.resolved = true;
        router.messages = router.messages.filter((w) => !w.resolved);
    });
}

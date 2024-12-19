/* eslint-disable  @typescript-eslint/no-explicit-any */
/**
 * Send and receive messages from worker to main thread
 */
import process from 'process';
import { webcrypto as crypto } from 'crypto';

import { bytesToHex } from './utils';
import { Router } from './router';

export interface SentMsg {
    msgId: string;
    resolve: (msg: any) => void;
    reject: (err: any) => void;
    resolved: boolean;
}

export function sendMessage<T>(router: Router, msg: any): Promise<T> {
    const msgId = bytesToHex(crypto.getRandomValues(new Uint8Array(8)));

    return new Promise((resolve, reject) => {
        if (!process.send) {
            reject(new Error('Not worker'));
            return;
        }

        const msgJson = JSON.parse(JSON.stringify(msg)) as any;
        msgJson.msgId = msgId;
        process.send(msgJson);

        router.messages.push({
            msgId,
            resolve,
            reject,
            resolved: false,
        });
    });
}

export function resolveMessages(router: Router) {
    process.on('message', (msg: any) => {
        const message = router.messages.find((w) => w.msgId === msg.msgId);

        if (!message) {
            return;
        }

        const msgJson = JSON.parse(JSON.stringify(msg)) as any;
        delete msgJson.msgId;
        message.resolve(msgJson);

        message.resolved = true;

        router.messages = router.messages.filter((w) => !w.resolved);
    });
}

import { Router } from './router';
export interface SentMsg {
    msgId: string;
    resolve: (msg: any) => void;
    reject: (err: any) => void;
    resolved: boolean;
}
export declare function sendMessage<T>(router: Router, msg: any): Promise<T>;
export declare function resolveMessages(router: Router): void;

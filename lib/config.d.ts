import 'dotenv/config';
export interface Config {
    /**
     * Router config
     */
    host: string;
    port: number;
    workers: number;
    reverseProxy: boolean;
    logLevel?: string;
    /**
     * Connection config (Required)
     */
    chainId: number;
    rpcUrl: string;
    mongoUrl: string;
    /**
     * Sync config
     */
    readOnly: boolean;
    startBlock: number;
    syncInterval: number;
    /**
     * Queue & Retries
     */
    maxRetry: number;
    retryAfter: number;
    blockQueue: number;
    blockConcurrency: number;
    blockBatch: number;
    maxReturn: number;
}
export declare function getConfig(): Config;

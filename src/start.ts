import process from 'process';
import cluster from 'cluster';
import type { Logger } from 'winston';

import { getConfig, Config } from './config';
import { getLogger, SyncManager, Router } from './services';

if (cluster.isWorker) {
    new Router(JSON.parse(process.env.config as string) as Config, Number(process.env.forkId));
} else {
    start();
}

async function forkRouter({
    config,
    logger,
    syncManager,
    forkId,
}: {
    config: Config;
    logger: Logger;
    syncManager: SyncManager;
    forkId: number;
}) {
    const worker = cluster.fork({
        config: JSON.stringify(config),
        forkId,
    });

    worker
        .on('exit', (code) => {
            logger.error(`Router Worker ${forkId} died with code ${code}, respawning...`);

            setTimeout(() => {
                forkRouter({
                    config,
                    logger,
                    syncManager,
                    forkId,
                });
            }, 5000);
        })
        .on('message', async (msg) => {
            const { msgId, type } = msg;

            if (type === 'status') {
                worker.send({
                    msgId,
                    localBlock: syncManager.localBlock,
                    onSync: syncManager.onSync,
                    errors: syncManager.errors.map(({ type, timestamp }) => ({ type, timestamp })),
                });
                return;
            }

            if (type === 'errors') {
                worker.send({
                    msgId,
                    errors: syncManager.errors,
                });
                return;
            }
        });
}

async function start() {
    const config = getConfig();
    const logger = getLogger(`[Main (${config.chainId})]`, config.logLevel);

    const syncManager = new SyncManager(config);

    await syncManager.startSync();

    // Spawn website
    let i = 0;
    while (i < config.workers) {
        forkRouter({
            config,
            logger,
            syncManager,
            forkId: i,
        });
        i++;
    }

    logger.info(`Spawned ${i} Router Workers`);
}

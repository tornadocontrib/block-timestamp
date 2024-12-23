"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = __importDefault(require("process"));
const cluster_1 = __importDefault(require("cluster"));
const config_1 = require("./config");
const services_1 = require("./services");
if (cluster_1.default.isWorker) {
    new services_1.Router(JSON.parse(process_1.default.env.config), Number(process_1.default.env.forkId));
}
else {
    start();
}
async function forkRouter({ config, logger, syncManager, forkId, }) {
    const worker = cluster_1.default.fork({
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
    const config = (0, config_1.getConfig)();
    const logger = (0, services_1.getLogger)(`[Main (${config.chainId})]`, config.logLevel);
    const syncManager = new services_1.SyncManager(config);
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

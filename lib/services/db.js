"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = exports.BlockSchema = void 0;
exports.recreateDB = recreateDB;
exports.connectDB = connectDB;
const mongoose_1 = require("mongoose");
const collectionOption = {
    storageEngine: {
        wiredTiger: {
            configString: 'block_compressor=zlib',
        },
    },
};
exports.BlockSchema = new mongoose_1.Schema({
    hash: String,
    number: { type: Number, index: true },
    timestamp: { type: Number, index: true },
});
exports.BlockSchema.index({ number: -1 });
exports.BlockSchema.index({ timestamp: -1 });
exports.Block = (0, mongoose_1.model)('Block', exports.BlockSchema, 'blocks');
async function recreateDB(mongoUrl) {
    await (0, mongoose_1.connect)(mongoUrl);
    await mongoose_1.connection.dropCollection('blocks');
    await exports.Block.createCollection(collectionOption);
    exports.Block.ensureIndexes();
}
async function connectDB(mongoUrl) {
    await (0, mongoose_1.connect)(mongoUrl);
    exports.Block.ensureIndexes();
}

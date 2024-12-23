import { Schema, connect, connection, model } from 'mongoose';

const collectionOption = {
    storageEngine: {
        wiredTiger: {
            configString: 'block_compressor=zlib',
        },
    },
};

export interface IBlock {
    hash: string;
    number: number;
    timestamp: number;
}

export const BlockSchema = new Schema<IBlock>({
    hash: String,
    number: { type: Number, index: true },
    timestamp: { type: Number, index: true },
});

BlockSchema.index({ number: -1 });
BlockSchema.index({ timestamp: -1 });

export const Block = model('Block', BlockSchema, 'blocks');

export async function recreateDB(mongoUrl: string) {
    await connect(mongoUrl);
    await connection.dropCollection('blocks');
    await Block.createCollection(collectionOption);
    Block.ensureIndexes();
}

export async function connectDB(mongoUrl: string) {
    await connect(mongoUrl);
    Block.ensureIndexes();
}

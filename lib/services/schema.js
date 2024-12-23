"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockNumSchema = exports.blockHashSchema = exports.bodySchema = void 0;
exports.bodySchema = {
    body: {
        oneOf: [
            {
                type: 'array',
                minItems: 1,
                maxItems: 30,
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        length: { type: 'number' },
                        timestamp_gte: { type: 'number' },
                        timestamp_lte: { type: 'number' },
                    },
                    additionalProperties: false,
                },
            },
            {
                type: 'object',
                properties: {
                    id: { type: 'number' },
                    length: { type: 'number' },
                    timestamp_gte: { type: 'number' },
                    timestamp_lte: { type: 'number' },
                },
                additionalProperties: false,
            },
        ],
    },
};
exports.blockHashSchema = {
    params: {
        type: 'object',
        properties: {
            blockHash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
        },
        required: ['blockHash'],
        additionalProperties: false,
    },
};
exports.blockNumSchema = {
    params: {
        type: 'object',
        properties: {
            blockNum: { type: 'number' },
        },
        required: ['blockNum'],
        additionalProperties: false,
    },
};

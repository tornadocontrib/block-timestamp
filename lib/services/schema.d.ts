export declare const bodySchema: {
    body: {
        oneOf: ({
            type: string;
            minItems: number;
            maxItems: number;
            items: {
                type: string;
                properties: {
                    id: {
                        type: string;
                    };
                    length: {
                        type: string;
                    };
                    timestamp_gte: {
                        type: string;
                    };
                    timestamp_lte: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            };
            properties?: undefined;
            additionalProperties?: undefined;
        } | {
            type: string;
            properties: {
                id: {
                    type: string;
                };
                length: {
                    type: string;
                };
                timestamp_gte: {
                    type: string;
                };
                timestamp_lte: {
                    type: string;
                };
            };
            additionalProperties: boolean;
            minItems?: undefined;
            maxItems?: undefined;
            items?: undefined;
        })[];
    };
};
export declare const blockHashSchema: {
    params: {
        type: string;
        properties: {
            blockHash: {
                type: string;
                pattern: string;
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
};
export declare const blockNumSchema: {
    params: {
        type: string;
        properties: {
            blockNum: {
                type: string;
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
};

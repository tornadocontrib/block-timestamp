import { Schema } from 'mongoose';
export interface IBlock {
    hash: string;
    number: number;
    timestamp: number;
}
export declare const BlockSchema: Schema<IBlock, import("mongoose").Model<IBlock, any, any, any, import("mongoose").Document<unknown, any, IBlock> & IBlock & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IBlock, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IBlock>> & import("mongoose").FlatRecord<IBlock> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const Block: import("mongoose").Model<IBlock, {}, {}, {}, import("mongoose").Document<unknown, {}, IBlock> & IBlock & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<IBlock, import("mongoose").Model<IBlock, any, any, any, import("mongoose").Document<unknown, any, IBlock> & IBlock & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IBlock, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IBlock>> & import("mongoose").FlatRecord<IBlock> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
export declare function recreateDB(mongoUrl: string): Promise<void>;
export declare function connectDB(mongoUrl: string): Promise<void>;

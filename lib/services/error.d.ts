export interface ErrorTypes {
    type: string;
    timestamp: number;
}
export interface ErrorMessages extends ErrorTypes {
    message?: string;
    stack?: string;
}
export declare function newError(type: string, err: any): ErrorMessages;

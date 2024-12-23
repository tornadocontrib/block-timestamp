export interface ErrorTypes {
    type: string;
    timestamp: number;
}

export interface ErrorMessages extends ErrorTypes {
    message?: string;
    stack?: string;
}

export function newError(
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err: any,
): ErrorMessages {
    return {
        type,
        timestamp: Math.floor(Date.now() / 1000),
        message: err.message,
        stack: err.stack,
    };
}

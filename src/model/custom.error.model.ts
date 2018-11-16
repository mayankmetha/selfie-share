export class CustomError extends Error {
    public constructor(statusCode: number, message?: string) {
        super(message);
        this.statusCode = statusCode;
    }

    public statusCode: number;
}
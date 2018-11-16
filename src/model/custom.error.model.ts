export class CustomError extends Error {
    public constructor(statusCode: number, message?: string) {
        super(message);
        this.statusCode = statusCode;
    }

    private statusCode: number;
}
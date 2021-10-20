export class ApplicationError extends Error {
    constructor(message: any) {
        super(JSON.stringify(['Application Error', message]));
    }
}

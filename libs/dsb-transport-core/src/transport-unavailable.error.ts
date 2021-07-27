export class TransportUnavailableError extends Error {
    constructor() {
        super(`Transport unavailable`);
    }
}

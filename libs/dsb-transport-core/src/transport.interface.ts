export const ITransport = Symbol('ITransport');
export interface ITransport {
    send(): void;
}

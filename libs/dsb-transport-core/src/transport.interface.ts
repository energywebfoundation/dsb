export const ITransport = Symbol('ITransport');
export interface ITransport {
    publish(fqcn: string, payload: string): Promise<string>;
    createChannel(fqcn: string): Promise<string>;
    removeChannel(fqcn: string): Promise<string>;
}

import { Message } from './message';

export const ITransport = Symbol('ITransport');
export interface ITransport {
    //TODO: consider moving clientId to generic type like NATSJetstreamOptions if clientId is NATSJS specific
    pull(fqcn: string, clientId: string, amount: number): Promise<Message[]>;
    publish(fqcn: string, payload: string): Promise<string>;
    createChannel(fqcn: string): Promise<string>;
    removeChannel(fqcn: string): Promise<string>;
    isConnected(): Promise<boolean>;
}

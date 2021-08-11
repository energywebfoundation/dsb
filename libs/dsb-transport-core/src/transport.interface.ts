import { Message } from './message';

export const ITransport = Symbol('ITransport');
export interface ITransport {
    //TODO: consider moving clientId to generic type like NATSJetstreamOptions if clientId is NATSJS specific
    pull(fqcn: string, clientId: string, amount: number): Promise<Message[]>;
    publish(fqcn: string, payload: string): Promise<string>;
    createChannel(fqcn: string, metadata?: any): Promise<string>;
    removeChannel(fqcn: string): Promise<string>;
    isConnected(): Promise<boolean>;
    hasChannel(name: string): Promise<boolean>;
    createConsumer(name: string, clientId: string): Promise<any>;
    removeConsumer(name: string, clientId: string): Promise<boolean>;
    hasConsumer(streamChannelName: string, consumer: string): Promise<boolean>;
    getChannelMetadata(fqcn: string): Promise<any>;
    subscribe(fqcn: string, clientId: string, cb: any): Promise<void>;
}

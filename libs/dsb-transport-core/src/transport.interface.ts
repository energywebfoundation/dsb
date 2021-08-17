import { Message } from './message';

export const ITransport = Symbol('ITransport');

export type Channel = {
    fqcn: string;
    topics?: {
        namespace: string;
        schemaType: 'json' | 'xml' | 'JSON' | 'XML';
        schema: string;
    }[];
    publishers?: string[];
    subscribers?: string[];
    maxMsgAge?: number;
    maxMsgSize?: number;
    createdBy?: string;
    createdDateTime?: string;
};

export interface ITransport {
    //TODO: consider moving clientId to generic type like NATSJetstreamOptions if clientId is NATSJS specific
    pull(fqcn: string, amount: number, clientId: string): Promise<Message[]>;
    publish(fqcn: string, topic: string, payload: string): Promise<string>;
    createChannel(channel: Channel, saveToAB?: boolean): Promise<string>;
    removeChannel(fqcn: string): Promise<string>;
    isConnected(): Promise<boolean>;
    hasChannel(name: string): Promise<boolean>;
    createConsumer(name: string, clientId: string): Promise<any>;
    removeConsumer(name: string, clientId: string): Promise<boolean>;
    hasConsumer(streamChannelName: string, consumer: string): Promise<boolean>;
    getChannel(fqcn: string): Promise<Channel>;
    subscribe(fqcn: string, clientId: string, cb: any): Promise<void>;
    channelsToPublish(did: string, roles: string[]): Channel[];
    channelsToSubscribe(did: string, roles: string[]): Channel[];
}

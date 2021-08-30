import { Channel } from './channel';
import { Message } from './message';

export const ITransport = Symbol('ITransport');

export interface ITransport {
    //TODO: consider moving clientId to generic type like NATSJetstreamOptions if clientId is NATSJS specific
    pull(fqcn: string, amount: number, clientId: string): Promise<Message[]>;
    publish(fqcn: string, topic: string, payload: string): Promise<string>;
    createChannel(channel: Channel, saveToAB?: boolean): Promise<string>;
    updateChannel(channel: Channel): Promise<string>;
    removeChannel(fqcn: string): Promise<string>;
    getChannel(fqcn: string): Channel;
    hasChannel(name: string): Promise<boolean>;
    isConnected(): Promise<boolean>;
    createConsumer(name: string, clientId: string): Promise<any>;
    removeConsumer(name: string, clientId: string): Promise<boolean>;
    hasConsumer(streamChannelName: string, consumer: string): Promise<boolean>;
    subscribe(
        fqcn: string,
        subject: string,
        clientId: string,
        cb: any,
        socketId?: string
    ): Promise<any>;
    unsubscribe(subcriptionsId: number): void;
    channelsToPublish(did: string, roles: string[]): Channel[];
    channelsToSubscribe(did: string, roles: string[]): Channel[];
}

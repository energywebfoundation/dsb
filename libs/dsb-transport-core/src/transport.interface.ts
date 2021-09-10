import { Channel } from './channel';
import { Message } from './message';

export const ITransport = Symbol('ITransport');

export interface ITransport {
    //TODO: consider moving clientId to generic type like NATSJetstreamOptions if clientId is NATSJS specific
    pull(fqcn: string, amount: number, clientId: string, from?: string): Promise<Message[]>;
    publish(fqcn: string, topic: string, payload: string, correlationId?: string): Promise<string>;
    createChannel(channel: Channel): Promise<string>;
    updateChannel(channel: Channel): Promise<string>;
    removeChannel(fqcn: string): Promise<string>;
    hasChannel(fqcn: string): Promise<boolean>;
    isConnected(): Promise<boolean>;
    subscribe(
        fqcn: string,
        subject: string,
        clientId: string,
        cb: (_err: any, _data?: any) => void
    ): Promise<any>;
    subscribe(
        fqcn: string,
        subject: string,
        clientId: string,
        socketId: string,
        cb: (_err: any, _data?: any) => void
    ): Promise<any>;
    subscribe(
        fqcn: string,
        subject: string,
        clientId: string,
        rewind: boolean,
        cb: (_err: any, _data?: any) => void
    ): Promise<any>;
    subscribe(
        fqcn: string,
        subject: string,
        clientId: string,
        socketId: string,
        rewind: boolean,
        cb: (_err: any, _data?: any) => void
    ): Promise<any>;
    unsubscribe(subcriptionsId: number): void;
}

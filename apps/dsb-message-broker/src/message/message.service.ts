import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server as WsServer } from 'socket.io';

import { ITransport, Message } from '@energyweb/dsb-transport-core';
import { TopicSchemaService } from '../utils/topic.schema.service';
import { AddressBookService } from '../addressbook/addressbook.service';

import { MessageDto, PublishMessageDto } from './dto';
import {
    UnauthorizedToPublishError,
    UnauthorizedToSubscribeError,
    PayloadNotValidError
} from './error';

@Injectable()
export class MessageService implements OnModuleInit {
    private transport: ITransport;
    public wsServer: WsServer;
    public subscriptions = new Map<string, Array<number>>();

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly topicSchemaService: TopicSchemaService,
        private readonly addressbook: AddressBookService
    ) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public setWsServer(server: WsServer) {
        this.wsServer = server;
    }
    public onConnection(socketId: string) {
        this.subscriptions.set(socketId, []);
    }
    public onDisconnect(socketId: string) {
        const subscriptions = this.subscriptions.get(socketId);
        if (!subscriptions) return;
        subscriptions.forEach((subId: number) => this.transport.unsubscribe(subId));
        this.subscriptions.delete(socketId);
    }

    public async publish(
        { fqcn, topic, payload, signature, correlationId }: PublishMessageDto,
        pubDID: string,
        pubVRs: string[]
    ): Promise<string> {
        this.ensureCanPublish(fqcn, pubDID, pubVRs);

        const { isValid, error } = this.topicSchemaService.validate(fqcn, topic, payload);
        if (!isValid) throw new PayloadNotValidError(topic, error);

        return this.transport.publish(
            fqcn,
            topic,
            JSON.stringify({ payload, signature, sender: pubDID }),
            correlationId
        );
    }

    public async pull(
        fqcn: string,
        amount: number,
        clientId: string,
        subDID: string,
        subVRs: string[]
    ): Promise<MessageDto[]> {
        this.ensureCanSubscribe(fqcn, subDID, subVRs);

        const consumerId = `${clientId ?? ''}${subDID}`;
        const messages = await this.transport.pull(fqcn, amount, consumerId);

        return messages.map(
            (message) =>
                ({
                    id: message.id,
                    topic: message.subject,
                    ...JSON.parse(message.data),
                    timestampNanos: message.timestampNanos,
                    correlationId: message.correlationId
                } as MessageDto)
        );
    }

    public async subscribe(
        fqcn: string,
        topic: string,
        subDID: string,
        subVRs: string[],
        socketId: string
    ): Promise<string> {
        this.ensureCanSubscribe(fqcn, subDID, subVRs);

        const subscriptionId = await this.transport.subscribe(
            fqcn,
            topic,
            subDID,
            this.pushMessageToSubscriber.bind(this),
            socketId
        );

        this.addToSubscriptions(socketId, subscriptionId);

        return subscriptionId;
    }
    public async pushMessageToSubscriber(err: any, to: string, msg: Message) {
        if (err) throw new Error(err.message);
        this.wsServer.to(to).emit('IncomingMessage', msg);
    }

    public unsubscribe(subscriptionId: number, socketId: string): void {
        this.transport.unsubscribe(subscriptionId);
        this.removeFromSubscriptions(socketId, subscriptionId);
    }

    private ensureCanPublish(fqcn: string, pubDID: string, pubVRs: string[]) {
        const channel = this.addressbook.getChannel(fqcn);
        let canPublish = channel?.publishers?.some((pub: string) =>
            [pubDID, ...pubVRs].some((per: string) => per === pub)
        );
        if (!channel || !channel.publishers || !channel.publishers.length) canPublish = true;
        if (!canPublish) throw new UnauthorizedToPublishError(fqcn);
        return;
    }
    private ensureCanSubscribe(fqcn: string, subDID: string, subVRs: string[]) {
        const channel = this.addressbook.getChannel(fqcn);
        let canSubscribe = channel?.subscribers?.some((sub: string) =>
            [subDID, ...subVRs].some((per: string) => per === sub)
        );
        if (!channel || !channel.subscribers || !channel.subscribers.length) canSubscribe = true;
        if (!canSubscribe) throw new UnauthorizedToSubscribeError(fqcn);
        return;
    }

    private addToSubscriptions(socketId: string, subscriptionId: number) {
        let subscriptions = this.subscriptions.get(socketId);
        if (!subscriptions) subscriptions = [];
        subscriptions.push(subscriptionId);
        this.subscriptions.set(socketId, subscriptions);
    }
    private removeFromSubscriptions(socketId: string, subscriptionId: number) {
        const subscriptions = this.subscriptions.get(socketId);
        if (!subscriptions) throw new Error();
        const subIndex = subscriptions.findIndex((subId) => subId === subscriptionId);
        subscriptions.splice(subIndex, 1);
        this.subscriptions.set(socketId, subscriptions);
    }
}

import { ITransport } from '@energyweb/dsb-transport-core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MessageDTO } from './dto/message.dto';
import { PublishMessageDto } from './dto/publish-message.dto';

@Injectable()
export class MessageService implements OnModuleInit {
    private transport: ITransport;

    constructor(private readonly moduleRef: ModuleRef) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public async publish(
        { fqcn, topic, payload, signature }: PublishMessageDto,
        senderDID: string,
        senderVR: string[]
    ): Promise<string> {
        const channelsToPublish = this.transport.channelsToPublish(senderDID, senderVR);
        const canPublish = channelsToPublish.some((channel) => channel.fqcn === fqcn);
        if (!canPublish) throw new Error('Not authorized to publish');

        return this.transport.publish(
            fqcn,
            topic,
            JSON.stringify({ payload, signature, sender: senderDID })
        );
    }

    public async pull(
        fqcn: string,
        amount: number,
        receiverDID: string,
        receiverVR: string[]
    ): Promise<MessageDTO[]> {
        const channelsToSubscribe = this.transport.channelsToSubscribe(receiverDID, receiverVR);
        const canSubscribe = channelsToSubscribe.some((channel) => channel.fqcn === fqcn);
        if (!canSubscribe) throw new Error('Not authorized to subscribe');

        const messages = await this.transport.pull(fqcn, amount, receiverDID);

        return messages.map(
            (message) =>
                ({
                    id: message.id,
                    topic: message.subject,
                    ...JSON.parse(message.data),
                    timestampNanos: message.timestampNanos
                } as MessageDTO)
        );
    }
}

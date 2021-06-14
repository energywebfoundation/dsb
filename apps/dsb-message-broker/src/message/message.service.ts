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
        sender: string,
        { fqcn, payload, signature }: PublishMessageDto
    ): Promise<string> {
        return this.transport.publish(fqcn, JSON.stringify({ sender, payload, signature }));
    }

    public async pull(fqcn: string, clientId: string, amount: number): Promise<MessageDTO[]> {
        const messages = await this.transport.pull(fqcn, clientId, amount);

        return messages.map((message) => JSON.parse(message) as MessageDTO);
    }
}

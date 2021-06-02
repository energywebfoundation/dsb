import { ITransport } from '@energyweb/dsb-transport-core';
import { OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export class MessageService implements OnModuleInit {
    private transport: ITransport;

    constructor(private readonly moduleRef: ModuleRef) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }
}

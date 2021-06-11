import { ITransport } from '@energyweb/dsb-transport-core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { CreateChannelDto } from './dto/create-channel.dto';
import { RemoveChannelDto } from './dto/remove-channel.dto';

@Injectable()
export class ChannelService implements OnModuleInit {
    private transport: ITransport;

    constructor(private readonly moduleRef: ModuleRef) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public async create({ fqcn }: CreateChannelDto): Promise<string> {
        return this.transport.createChannel(fqcn);
    }

    public async remove({ fqcn }: RemoveChannelDto): Promise<string> {
        return this.transport.removeChannel(fqcn);
    }
}

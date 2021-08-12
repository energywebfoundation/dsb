import { ITransport } from '@energyweb/dsb-transport-core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ChannelMetadata } from '@energyweb/dsb-address-book-core';

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

    public async create({ fqcn, metadata }: CreateChannelDto): Promise<string> {
        return this.transport.createChannel(fqcn, metadata);
    }

    public async remove({ fqcn }: RemoveChannelDto): Promise<string> {
        return this.transport.removeChannel(fqcn);
    }

    public async getMetadata(fcqn: string): Promise<ChannelMetadata> {
        return this.transport.getChannelMetadata(fcqn);
    }
}

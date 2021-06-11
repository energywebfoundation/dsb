import { ITransport } from '@energyweb/dsb-transport-core';
import { NATSJetstreamTransport } from '@energyweb/dsb-transport-nats-js';
import { Module } from '@nestjs/common';

import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
    controllers: [ChannelController],
    providers: [
        {
            provide: ITransport,
            useValue: new NATSJetstreamTransport(['nats://localhost:4222'])
        },
        ChannelService
    ],
    exports: [ChannelService]
})
export class ChannelModule {}

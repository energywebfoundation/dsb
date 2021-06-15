import { Module } from '@nestjs/common';

import { transportFactory } from '../nats-js-transport.provider';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
    controllers: [ChannelController],
    providers: [transportFactory, ChannelService],
    exports: [ChannelService]
})
export class ChannelModule {}

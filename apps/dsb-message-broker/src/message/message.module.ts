import { Module } from '@nestjs/common';

import { transportFactory } from '../nats-js-transport.provider';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
    controllers: [MessageController],
    providers: [transportFactory, MessageService]
})
export class MessageModule {}

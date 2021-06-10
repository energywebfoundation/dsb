import { ITransport } from '@energyweb/dsb-transport-core';
import { NATSJetstreamTransport } from '@energyweb/dsb-transport-nats-js';
import { Module } from '@nestjs/common';

import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
    imports: [],
    controllers: [MessageController],
    providers: [
        {
            provide: ITransport,
            useValue: new NATSJetstreamTransport(['nats://localhost:4222'])
        },
        MessageService
    ]
})
export class MessageModule {}

import { ITransport } from '@energyweb/dsb-transport-core';
import { NATSJetstreamTransport } from '@energyweb/dsb-transport-nats-js';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [
        {
            provide: ITransport,
            useClass: NATSJetstreamTransport
        }
    ]
})
export class MessageModule {}

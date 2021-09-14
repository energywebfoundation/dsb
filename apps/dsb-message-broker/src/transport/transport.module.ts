import { ITransport } from '@energyweb/dsb-transport-core';
import { NATSJetstreamTransport } from '@energyweb/dsb-transport-nats-js';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('TransportFactory');

const transportFactory = {
    provide: ITransport,
    useFactory: async (configService: ConfigService) => {
        const url = configService.get('NATS_JS_URL');
        logger.log(`Creating NATS Jetstream client at ${url}`);

        const dupWindow = configService.get('DUPLICATE_WINDOW');

        const transport = new NATSJetstreamTransport([url], parseInt(dupWindow));

        await transport.connect();

        return transport;
    },
    inject: [ConfigService]
};

@Module({
    providers: [transportFactory],
    exports: [transportFactory]
})
export class TransportModule {}

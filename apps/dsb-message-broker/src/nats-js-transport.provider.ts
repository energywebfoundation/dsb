import { ITransport } from '@energyweb/dsb-transport-core';
import { NATSJetstreamTransport } from '@energyweb/dsb-transport-nats-js';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('TransportFactory');

export const transportFactory = {
    provide: ITransport,
    useFactory: (configService: ConfigService) => {
        const url = configService.get('NATS_JS_URL');
        logger.log(`Using NATS Jetstream node at ${url}`);

        return new NATSJetstreamTransport([url]);
    },
    inject: [ConfigService]
};

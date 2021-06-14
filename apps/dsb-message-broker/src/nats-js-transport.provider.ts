import { ITransport } from '@energyweb/dsb-transport-core';
import { NATSJetstreamTransport } from '@energyweb/dsb-transport-nats-js';
import { ConfigService } from '@nestjs/config';

export const transportFactory = {
    provide: ITransport,
    useFactory: (configService: ConfigService) => {
        const url = configService.get('NATS_JS_URL');
        return new NATSJetstreamTransport([url]);
    },
    inject: [ConfigService]
};

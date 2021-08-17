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
        const web3Url = configService.get('WEB3_URL');
        const privateKey = configService.get('PRIVATE_KEY');
        const mbDID = configService.get('MB_DID');

        // console.log("mbDID ", mbDID);
        // const orgs = configService.get('ORGANIZATIONS');
        // console.log("orgs ", orgs);

        const transport = new NATSJetstreamTransport([url], web3Url, privateKey, mbDID);

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

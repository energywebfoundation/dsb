import { ChannelMetadata, IAddressBook } from '@energyweb/dsb-address-book-core';
import { NATSJetstreamTransport } from '@energyweb/dsb-transport-nats-js';
import { IAM } from 'iam-client-lib';

export class NatsJetstreamAddressBook implements IAddressBook {
    private readonly addressBookChannel = 'channels.dsb.apps.energyweb.iam.ewc';
    private readonly cache = new Map<string, ChannelMetadata>();

    constructor(
        private readonly transport: NATSJetstreamTransport,
        private readonly web3Url: string,
        readonly privateKey: string
    ) {}

    public async init() {
        // fill the cache here and create a push subscriber
    }

    public async findByFqcn(fqcn: string): Promise<ChannelMetadata> {
        return this.cache.get(fqcn);
    }

    public async register(channelMetadata: ChannelMetadata): Promise<void> {
        const iam = new IAM({ rpcUrl: this.web3Url, privateKey: this.privateKey });
        await iam.initializeConnection({ initCacheServer: false });

        const claim = await iam.createPublicClaim({
            subject: channelMetadata.fqcn,
            data: { ...channelMetadata }
        });

        await this.transport.publish(this.addressBookChannel, claim);
    }
}

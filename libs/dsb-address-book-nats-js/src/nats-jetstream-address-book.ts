import { ChannelMetadata, IAddressBook } from '@energyweb/dsb-address-book-core';
import { ITransport } from '@energyweb/dsb-transport-core';
import { IAM } from 'iam-client-lib';

export { IAddressBook, ChannelMetadata };
export class NatsJetstreamAddressBook implements IAddressBook {
    private readonly addressBookChannel = 'channels.dsb.apps.energyweb.iam.ewc';
    private readonly cache = new Map<string, ChannelMetadata>();
    private iam: IAM;

    constructor(
        private readonly transport: ITransport,
        private readonly web3Url: string,
        private readonly privateKey: string,
        private readonly mbDID: string
    ) {
        this.iam = new IAM({ rpcUrl: this.web3Url, privateKey: this.privateKey });
    }

    public async init() {
        await this.iam.initializeConnection({ initCacheServer: false });

        const abChannelIsAvailable = await this.transport.hasChannel(this.addressBookChannel);
        if (!abChannelIsAvailable) await this.transport.createChannel(this.addressBookChannel);

        const adConsumerIsAvaiable = await this.transport.hasConsumer(
            this.addressBookChannel,
            this.mbDID
        );
        if (adConsumerIsAvaiable)
            await this.transport.removeConsumer(this.addressBookChannel, this.mbDID);

        this.transport.subscribe(this.addressBookChannel, this.mbDID, async (msg: any) => {
            const claim: any = await this.iam.decodeJWTToken({ token: msg.data });
            this.cache.set(claim.sub, claim.claimData);
        });
    }

    public async findByFqcn(fqcn: string): Promise<ChannelMetadata> {
        return this.cache.get(fqcn);
    }

    public async register(fqcn: string, channelMetadata: ChannelMetadata): Promise<void> {
        const claim = await this.iam.createPublicClaim({
            subject: fqcn,
            data: { ...channelMetadata }
        });

        await this.transport.publish(this.addressBookChannel, claim);
    }
}

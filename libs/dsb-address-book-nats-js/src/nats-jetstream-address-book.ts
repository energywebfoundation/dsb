import { IAddressBook } from '@energyweb/dsb-address-book-core';
import { ITransport, Channel } from '@energyweb/dsb-transport-core';
import { IAM } from 'iam-client-lib';

export { IAddressBook };
export class NatsJetstreamAddressBook implements IAddressBook {
    private readonly addressBookChannel = 'channels.dsb.apps.energyweb.iam.ewc';
    private readonly cache = new Map<string, Channel>();
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
        if (!abChannelIsAvailable)
            await this.transport.createChannel(
                {
                    fqcn: this.addressBookChannel
                },
                false
            );

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

    public findByFqcn(fqcn: string): Channel {
        return this.cache.get(fqcn);
    }
    public findByPublishers(publishers: string[]): Channel[] {
        const channels = [];
        const iterator = this.cache.values();
        let channel, isAvailable;
        do {
            channel = iterator.next();

            if (!channel.value) isAvailable = false;
            else if (!channel.value.publishers) isAvailable = true;
            else
                isAvailable = channel.value.publishers.some((_pub: string) =>
                    publishers.some((pub: string) => _pub === pub)
                );

            if (isAvailable) channels.push(channel.value);
        } while (!channel.done);

        return channels;
    }
    public findBySubscribers(subscribers: string[]): Channel[] {
        const channels = [];
        const iterator = this.cache.values();
        let channel, isAvailable;
        do {
            channel = iterator.next();

            if (!channel.value) isAvailable = false;
            else if (!channel.value.subscribers) isAvailable = true;
            else
                isAvailable = channel.value.subscribers.some((_pub: string) =>
                    subscribers.some((pub: string) => _pub === pub)
                );

            if (isAvailable) channels.push(channel.value);
        } while (!channel.done);

        return channels;
    }

    public async register(channel: Channel): Promise<void> {
        const claim = await this.iam.createPublicClaim({
            subject: channel.fqcn,
            data: { ...channel }
        });

        await this.transport.publish(this.addressBookChannel, 'default', claim);
    }
}

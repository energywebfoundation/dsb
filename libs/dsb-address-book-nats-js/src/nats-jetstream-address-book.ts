import { IAddressBook } from '@energyweb/dsb-address-book-core';
import { ITransport, Channel } from '@energyweb/dsb-transport-core';
import { initWithPrivateKeySigner, DidRegistry } from 'iam-client-lib';

export { IAddressBook };

export class NatsJetstreamAddressBook implements IAddressBook {
    private readonly addressBookChannel = 'channels.dsb.apps.energyweb.iam.ewc';
    private readonly cache = new Map<string, Channel>();
    private didRegistry: DidRegistry;

    constructor(
        private readonly transport: ITransport,
        private readonly web3Url: string,
        private readonly privateKey: string,
        private readonly mbDID: string
    ) {}

    public async init() {
        const { signerService, connectToCacheServer } = await initWithPrivateKeySigner(
            this.privateKey,
            this.web3Url
        );
        const { connectToDidRegistry } = await connectToCacheServer();
        const { didRegistry } = await connectToDidRegistry();
        this.didRegistry = didRegistry;

        const abChannelIsAvailable = await this.transport.hasChannel(this.addressBookChannel);
        if (!abChannelIsAvailable)
            await this.transport.createChannel({
                fqcn: this.addressBookChannel
            });

        await this.transport.subscribe(
            this.addressBookChannel,
            'default',
            this.mbDID,
            true,
            async (err: Error, msg: any) => {
                if (err) return;
                const claim: any = await this.didRegistry.decodeJWTToken({ token: msg.data });
                if (claim.claimData.action === 'remove') return this.cache.delete(claim.sub);
                this.cache.set(claim.sub, claim.claimData);
            }
        );
    }

    public findByFqcn(fqcn: string): Channel {
        return this.cache.get(fqcn);
    }

    public findByPublishers(publishers: string[]): Channel[] {
        const channels = [];
        let isAvailable;
        for (const channel of this.cache.values()) {
            if (!channel.publishers) isAvailable = true;
            else
                isAvailable = channel.publishers.some((_pub: string) =>
                    publishers.some((pub: string) => pub === _pub)
                );
            if (isAvailable) channels.push(channel);
        }
        return channels;
    }

    public findBySubscribers(subscribers: string[]): Channel[] {
        const channels = [];
        let isAvailable;
        for (const channel of this.cache.values()) {
            if (!channel.subscribers) isAvailable = true;
            else
                isAvailable = channel.subscribers.some((_sub: string) =>
                    subscribers.some((sub: string) => sub === _sub)
                );

            if (isAvailable) channels.push(channel);
        }
        return channels;
    }

    public async register(channel: Channel): Promise<void> {
        const claim = await this.didRegistry.createPublicClaim({
            subject: channel.fqcn,
            data: { ...channel }
        });

        await this.transport.publish(this.addressBookChannel, 'default', claim);

        this.cache.set(channel.fqcn, channel);
    }

    public async remove(fqcn: string): Promise<void> {
        const claim = await this.didRegistry.createPublicClaim({
            subject: fqcn,
            data: { action: 'remove' }
        });

        await this.transport.publish(this.addressBookChannel, 'default', claim);
    }
}

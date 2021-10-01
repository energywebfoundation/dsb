import { IAddressBook } from '@energyweb/dsb-address-book-core';
import { ITransport, Channel } from '@energyweb/dsb-transport-core';
import { IAM, setCacheClientOptions } from 'iam-client-lib';

export { IAddressBook };
export class NatsJetstreamAddressBook implements IAddressBook {
    private readonly addressBookChannel = 'channels.dsb.apps.energyweb.iam.ewc';
    private readonly cache = new Map<string, Channel>();
    private iam: IAM;

    constructor(
        private readonly transport: ITransport,
        private readonly web3Url: string,
        private readonly privateKey: string,
        private readonly mbDID: string,
        private readonly cacheServerUrl: string
    ) {
        setCacheClientOptions(73799, {
            url: cacheServerUrl
        });

        this.iam = new IAM({ rpcUrl: this.web3Url, privateKey: this.privateKey });
    }

    public async init() {
        await this.iam.initializeConnection({ initCacheServer: false });

        const abChannelIsAvailable = await this.transport.hasChannel(this.addressBookChannel);
        if (!abChannelIsAvailable)
            await this.transport.createChannel({
                fqcn: this.addressBookChannel
            });

        this.transport.subscribe(
            this.addressBookChannel,
            'default',
            this.mbDID,
            true,
            async (err: Error, msg: any) => {
                if (err) return;
                const claim: any = await this.iam.decodeJWTToken({ token: msg.data });
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
        const claim = await this.iam.createPublicClaim({
            subject: channel.fqcn,
            data: { ...channel }
        });

        await this.transport.publish(this.addressBookChannel, 'default', claim);

        this.cache.set(channel.fqcn, channel);
    }

    public async remove(fqcn: string): Promise<void> {
        const claim = await this.iam.createPublicClaim({
            subject: fqcn,
            data: { action: 'remove' }
        });

        await this.transport.publish(this.addressBookChannel, 'default', claim);
    }
}

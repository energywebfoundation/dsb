import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITransport, Channel } from '@energyweb/dsb-transport-core';
import { NatsJetstreamAddressBook } from '@energyweb/dsb-address-book-nats-js';

@Injectable()
export class AddressBookService implements OnModuleInit {
    private transport: ITransport;
    private addressBook: NatsJetstreamAddressBook;

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly configService: ConfigService
    ) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
        const web3Url = this.configService.get('WEB3_URL');
        const privateKey = this.configService.get('PRIVATE_KEY');
        const mbDID = this.configService.get('MB_DID');

        this.addressBook = new NatsJetstreamAddressBook(this.transport, web3Url, privateKey, mbDID);
        await this.addressBook.init();
    }

    public registerChannel(channel: Channel) {
        this.addressBook.register(channel);
    }

    public getChannel(fqcn: string): Channel {
        return this.addressBook.findByFqcn(fqcn);
    }

    public removeChannel(fqcn: string): void {
        this.addressBook.remove(fqcn);
    }

    public channelsToPublish(did: string, roles: string[]): Channel[] {
        const channels = this.addressBook.findByPublishers([did, ...roles]);
        return channels;
    }
    public channelsToSubscribe(did: string, roles: string[]): Channel[] {
        const channels = this.addressBook.findBySubscribers([did, ...roles]);
        return channels;
    }
}

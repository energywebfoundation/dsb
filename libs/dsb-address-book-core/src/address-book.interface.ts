import { Channel } from '@energyweb/dsb-transport-core';

export const IAddressBook = Symbol('IAddressBook');

export interface IAddressBook {
    register(channel: Channel): Promise<void>;
    remove(fqcn: string): Promise<void>;
    findByFqcn(fqcn: string): Channel;
    findByPublishers(publishers: string[]): Channel[];
    findBySubscribers(subscribers: string[]): Channel[];
}

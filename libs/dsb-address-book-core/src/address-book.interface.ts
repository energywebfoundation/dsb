import { ChannelMetadata } from './channel-metadata';

export const IAddressBook = Symbol('IAddressBook');

export interface IAddressBook {
    register(fqcn: string, channelMetadata: ChannelMetadata): Promise<void>;
    findByFqcn(fqcn: string): Promise<ChannelMetadata>;
}

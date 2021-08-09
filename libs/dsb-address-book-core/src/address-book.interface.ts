import { ChannelMetadata } from './channel-metadata';

export interface IAddressBook {
    register(channelMetadata: ChannelMetadata): Promise<void>;
    findByFqcn(fqcn: string): Promise<ChannelMetadata>;
}

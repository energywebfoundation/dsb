import { Injectable } from '@nestjs/common';

import { ChannelService } from '../src/channel/channel.service';
import { CreateChannelDto, UpdateChannelDto } from '../src/channel/dto';

@Injectable()
export class ChannelManagerService {
    private channels: string[] = [];

    constructor(private readonly channelService: ChannelService) {}

    public async cleanUp(): Promise<void> {
        for (const channel of this.channels) {
            await this.channelService.remove({
                fqcn: channel,
                userDID: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596'
            });
        }
    }

    public async create(channel: CreateChannelDto) {
        await this.channelService.createChannel({
            ...channel,
            createdBy: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
            createdDateTime: new Date().toUTCString()
        });

        this.channels.push(channel.fqcn);
    }

    public async update(channel: UpdateChannelDto) {
        await this.channelService.updateChannel({
            ...channel,
            modifiedBy: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
            modifiedDateTime: new Date().toUTCString()
        });
    }

    public async remove(channel: string) {
        await this.channelService.remove({
            fqcn: channel,
            userDID: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596'
        });
    }
}

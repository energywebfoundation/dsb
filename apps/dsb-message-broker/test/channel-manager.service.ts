import { Injectable } from '@nestjs/common';

import { ChannelService } from '../src/channel/channel.service';
import { CreateChannelDto } from '../src/channel/dto/create-channel.dto';

@Injectable()
export class ChannelManagerService {
    private channels: string[] = [];

    constructor(private readonly channelService: ChannelService) {}

    public async cleanUp(): Promise<void> {
        for (const channel of this.channels) {
            await this.channelService.remove({ fqcn: channel });
        }
    }

    public async create(channel: CreateChannelDto) {
        await this.channelService.create(channel);

        this.channels.push(channel.fqcn);
    }
}

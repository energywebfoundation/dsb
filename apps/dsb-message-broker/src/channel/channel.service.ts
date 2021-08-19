import { ITransport, Channel, ChannelNotFoundError } from '@energyweb/dsb-transport-core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { CreateChannelDto } from './dto/create-channel.dto';
import { RemoveChannelDto } from './dto/remove-channel.dto';
import { TopicSchemaService } from '../utils/topic.schema.service';

@Injectable()
export class ChannelService implements OnModuleInit {
    private transport: ITransport;

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly topicSchemaService: TopicSchemaService
    ) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public async createChannel(
        channelData: CreateChannelDto & { createdBy: string; createdDateTime: string }
    ): Promise<string> {
        if (!channelData.admins) channelData.admins = [channelData.createdBy];

        return this.transport.createChannel(channelData);
    }

    public async updateChannel(
        channelData: CreateChannelDto & { modifiedBy: string; modifiedDateTime: string }
    ): Promise<string> {
        const _channel = this.transport.getChannel(channelData.fqcn);
        if (!_channel) throw new ChannelNotFoundError(channelData.fqcn);
        const canModify = _channel.admins.some((_admin) => _admin === channelData.modifiedBy);
        if (!canModify) throw new Error('Unauthorized to modify.');

        _channel.topics.forEach((_topic) =>
            this.topicSchemaService.removeValidator(_channel.fqcn, _topic.namespace)
        );

        return this.transport.updateChannel({ ..._channel, ...channelData });
    }

    public async getAccessibleChannels(userDID: string, userVR: string[]): Promise<Channel[]> {
        const channelsToPublish = this.transport.channelsToPublish(userDID, userVR);
        const channelsToSubscribe = this.transport.channelsToSubscribe(userDID, userVR);

        const uniqueChannels = [...channelsToPublish, ...channelsToSubscribe].filter(
            (channel, index, self) => {
                return self.findIndex((_channel) => _channel.fqcn === channel.fqcn) === index;
            }
        );

        return uniqueChannels;
    }

    public async getChannel(fqcn: string): Promise<Channel> {
        return this.transport.getChannel(fqcn);
    }

    public async remove({ fqcn }: RemoveChannelDto): Promise<string> {
        return this.transport.removeChannel(fqcn);
    }
}

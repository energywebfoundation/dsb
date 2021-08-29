import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { ITransport, Channel, ChannelNotFoundError } from '@energyweb/dsb-transport-core';

import { TopicSchemaService } from '../utils/topic.schema.service';

import { CreateChannelDto, UpdateChannelDto, RemoveChannelDto } from './dto';
import { UnauthorizedToModifyError } from './error';

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
        channelData: UpdateChannelDto & { modifiedBy: string; modifiedDateTime: string }
    ): Promise<string> {
        this.ensureCanModify(channelData.fqcn, channelData.modifiedBy);

        const _channel = this.transport.getChannel(channelData.fqcn);

        _channel.topics.forEach((_topic: any) =>
            this.topicSchemaService.removeValidator(_channel.fqcn, _topic.namespace)
        );

        return this.transport.updateChannel({ ..._channel, ...channelData });
    }

    public async getAccessibleChannels(userDID: string, userVR: string[]): Promise<Channel[]> {
        const channelsToPublish = this.transport.channelsToPublish(userDID, userVR);
        const channelsToSubscribe = this.transport.channelsToSubscribe(userDID, userVR);

        const uniqueChannels = [...channelsToPublish, ...channelsToSubscribe].filter(
            (channel, index, self) => {
                return self.findIndex((_channel: any) => _channel.fqcn === channel.fqcn) === index;
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

    private ensureCanModify(fqcn: string, modDID: string) {
        const channel = this.transport.getChannel(fqcn);
        let canModify = channel?.admins?.some((admin: string) => admin === modDID);
        if (!channel || !channel.admins || !channel.admins.length) canModify = true;
        if (!canModify) throw new UnauthorizedToModifyError(fqcn);
        return;
    }
}

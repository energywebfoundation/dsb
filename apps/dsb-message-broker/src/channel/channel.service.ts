import { ITransport, Channel } from '@energyweb/dsb-transport-core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { CreateChannelDto } from './dto/create-channel.dto';
import { RemoveChannelDto } from './dto/remove-channel.dto';
import { extractFqcn } from '../utils';

@Injectable()
export class ChannelService implements OnModuleInit {
    private transport: ITransport;

    constructor(
        private readonly configService: ConfigService,
        private readonly moduleRef: ModuleRef
    ) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public async create(
        channelData: CreateChannelDto & { createdBy: string; createdDateTime: string }
    ): Promise<string> {
        const { org, app, channel } = extractFqcn(channelData.fqcn);
        const organizations = this.configService.get('ORGANIZATIONS');
        const fqcnIsValid = organizations.some((_org: any) => {
            if (_org.name !== org) return false;
            return _org.apps.some((_app: any) => {
                if (_app.name !== app) return false;

                return new RegExp(_app.channels).test(channel);
            });
        });
        if (!fqcnIsValid) throw new Error('fqcn does not match the defined pattern.');

        return this.transport.createChannel(channelData);
    }

    public async getAvailableChannels(userDID: string, userVR: string[]): Promise<Channel[]> {
        const channelsToPublish = this.transport.channelsToPublish(userDID, userVR);
        const channelsToSubscribe = this.transport.channelsToSubscribe(userDID, userVR);

        const uniqueChannels = [...channelsToPublish, ...channelsToSubscribe].filter(
            (channel, index, self) => {
                return self.findIndex((_channel) => _channel.fqcn === channel.fqcn) === index;
            }
        );

        return uniqueChannels;
    }

    public async remove({ fqcn }: RemoveChannelDto): Promise<string> {
        return this.transport.removeChannel(fqcn);
    }

    public async getChannel(fcqn: string): Promise<Channel> {
        return this.transport.getChannel(fcqn);
    }
}

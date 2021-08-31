import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { ITransport, Channel } from '@energyweb/dsb-transport-core';

import { TopicSchemaService } from '../utils/topic.schema.service';
import { AddressBookService } from '../addressbook/addressbook.service';

import { CreateChannelDto, UpdateChannelDto, RemoveChannelDto, ReadChannelDto } from './dto';
import {
    UnauthorizedToModifyError,
    UnauthorizedToRemoveError,
    UnauthorizedToGetError,
    ChannelNotFoundError
} from './error';

@Injectable()
export class ChannelService implements OnModuleInit {
    private transport: ITransport;

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly topicSchemaService: TopicSchemaService,
        private readonly addressbook: AddressBookService
    ) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public async createChannel(
        createDto: CreateChannelDto & { createdBy: string; createdDateTime: string }
    ): Promise<string> {
        if (!createDto.admins) createDto.admins = [createDto.createdBy];

        const result = await this.transport.createChannel(createDto);

        this.addressbook.registerChannel(createDto);

        return result;
    }

    public async updateChannel(
        updateDto: UpdateChannelDto & { modifiedBy: string; modifiedDateTime: string }
    ): Promise<string> {
        this.ensureCanModifyOrRemove(updateDto.fqcn, updateDto.modifiedBy, 'modify');

        const currentchannel = this.addressbook.getChannel(updateDto.fqcn);

        const updatedChannel = { ...currentchannel, ...updateDto };

        const result = this.transport.updateChannel(updatedChannel);

        this.topicSchemaService.removeValidators(updateDto.fqcn);

        this.addressbook.registerChannel(updatedChannel);

        return result;
    }

    public async getAccessibleChannels(userDID: string, userVRs: string[]): Promise<Channel[]> {
        const channelsToPublish = this.addressbook.channelsToPublish(userDID, userVRs);
        const channelsToSubscribe = this.addressbook.channelsToSubscribe(userDID, userVRs);

        const uniqueChannels = [...channelsToPublish, ...channelsToSubscribe].filter(
            (channel, index, self) => {
                return self.findIndex((_channel: any) => _channel.fqcn === channel.fqcn) === index;
            }
        );

        return uniqueChannels;
    }

    public async getChannel({
        fqcn,
        usrDID,
        usrVRs
    }: ReadChannelDto & { usrDID: string; usrVRs: string[] }): Promise<Channel> {
        this.ensureCanPublishOrSubscribe(fqcn, usrDID, usrVRs);

        const channel = this.addressbook.getChannel(fqcn);
        if (!channel) throw new ChannelNotFoundError(fqcn);
        return channel;
    }

    public async remove({ fqcn, usrDID }: RemoveChannelDto & { usrDID: string }): Promise<string> {
        this.ensureCanModifyOrRemove(fqcn, usrDID, 'remove');

        const result = this.transport.removeChannel(fqcn);

        this.topicSchemaService.removeValidators(fqcn);

        this.addressbook.removeChannel(fqcn);

        return result;
    }

    private ensureCanPublishOrSubscribe(fqcn: string, usrDID: string, usrVRs: string[]) {
        const channel = this.addressbook.getChannel(fqcn);

        let canPublish = channel?.publishers?.some((pub: string) =>
            [usrDID, ...usrVRs].some((usr: string) => usr === pub)
        );
        if (!channel || !channel.publishers || !channel.publishers.length) canPublish = true;

        let canSubscribe = channel?.subscribers?.some((sub: string) =>
            [usrDID, ...usrVRs].some((usr: string) => usr === sub)
        );
        if (!channel || !channel.subscribers || !channel.subscribers.length) canSubscribe = true;

        if (!canPublish && !canSubscribe) throw new UnauthorizedToGetError(fqcn);

        return;
    }

    private ensureCanModifyOrRemove(fqcn: string, modDID: string, mode: 'modify' | 'remove'): void {
        const channel = this.addressbook.getChannel(fqcn);
        let canModify = channel?.admins?.some((admin: string) => admin === modDID);
        if (!channel || !channel.admins || !channel.admins.length) canModify = true;
        if (!canModify && mode === 'modify') throw new UnauthorizedToModifyError(fqcn);
        if (!canModify && mode === 'remove') throw new UnauthorizedToRemoveError(fqcn);
        return;
    }
}

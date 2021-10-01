import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { Channel, ITransport } from '@energyweb/dsb-transport-core';

import { TopicSchemaService } from '../utils/topic.schema.service';
import { AddressBookService } from '../addressbook/addressbook.service';

import { CreateChannelDto, ReadChannelDto, RemoveChannelDto, UpdateChannelDto } from './dto';
import {
    ChannelNotFoundError,
    UnauthorizedToGetError,
    UnauthorizedToModifyError,
    UnauthorizedToRemoveError
} from './error';

@Injectable()
export class ChannelService implements OnModuleInit {
    private transport: ITransport;

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly topicSchemaService: TopicSchemaService,
        private readonly addressBook: AddressBookService
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

        await this.addressBook.registerChannel(createDto);

        return result;
    }

    public async updateChannel(
        updateDto: UpdateChannelDto & { modifiedBy: string; modifiedDateTime: string }
    ): Promise<string> {
        this.ensureCanModifyOrRemove(updateDto.fqcn, updateDto.modifiedBy, 'modify');

        const currentChannel = this.addressBook.getChannel(updateDto.fqcn);

        const updatedChannel = { ...currentChannel, ...updateDto };

        const result = await this.transport.updateChannel(updatedChannel);

        await this.addressBook.registerChannel(updatedChannel);

        return result;
    }

    public async getAccessibleChannels(userDID: string, userVRs: string[]): Promise<Channel[]> {
        const channelsToPublish = this.addressBook.channelsToPublish(userDID, userVRs);
        const channelsToSubscribe = this.addressBook.channelsToSubscribe(userDID, userVRs);

        return [...channelsToPublish, ...channelsToSubscribe].filter((channel, index, self) => {
            return self.findIndex((_channel: any) => _channel.fqcn === channel.fqcn) === index;
        });
    }

    public async getChannel({
        fqcn,
        userDID,
        userVRs
    }: ReadChannelDto & { userDID: string; userVRs: string[] }): Promise<Channel> {
        this.ensureCanPublishOrSubscribe(fqcn, userDID, userVRs);

        const channel = this.addressBook.getChannel(fqcn);
        if (!channel) throw new ChannelNotFoundError(fqcn);
        return channel;
    }

    public async remove({
        fqcn,
        userDID
    }: RemoveChannelDto & { userDID: string }): Promise<string> {
        this.ensureCanModifyOrRemove(fqcn, userDID, 'remove');

        const result = this.transport.removeChannel(fqcn);

        this.topicSchemaService.removeValidators(fqcn);

        await this.addressBook.removeChannel(fqcn);

        return result;
    }

    private ensureCanPublishOrSubscribe(fqcn: string, userDID: string, userVRs: string[]) {
        const channel = this.addressBook.getChannel(fqcn);

        let canPublish = channel?.publishers?.some((pub: string) =>
            [userDID, ...userVRs].some((usr: string) => usr === pub)
        );
        if (!channel || !channel.publishers || !channel.publishers.length) canPublish = true;

        let canSubscribe = channel?.subscribers?.some((sub: string) =>
            [userDID, ...userVRs].some((usr: string) => usr === sub)
        );
        if (!channel || !channel.subscribers || !channel.subscribers.length) canSubscribe = true;

        if (!canPublish && !canSubscribe) throw new UnauthorizedToGetError(fqcn);

        return;
    }

    private ensureCanModifyOrRemove(
        fqcn: string,
        userDID: string,
        mode: 'modify' | 'remove'
    ): void {
        const channel = this.addressBook.getChannel(fqcn);

        let canModifyOrRemove = channel?.admins?.some((admin: string) => admin === userDID);

        if (!channel || !channel.admins || !channel.admins.length) canModifyOrRemove = true;

        if (!canModifyOrRemove && mode === 'modify') throw new UnauthorizedToModifyError(fqcn);
        if (!canModifyOrRemove && mode === 'remove') throw new UnauthorizedToRemoveError(fqcn);

        return;
    }
}

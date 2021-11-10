import { Logger, Module } from '@nestjs/common';

import { TransportModule } from '../transport/transport.module';
import { AddressBookModule } from '../addressbook/addressbook.module';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
    imports: [TransportModule, AddressBookModule],
    controllers: [ChannelController],
    providers: [Logger, ChannelService],
    exports: [ChannelService]
})
export class ChannelModule {}

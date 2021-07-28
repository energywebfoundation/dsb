import { Module } from '@nestjs/common';

import { TransportModule } from '../transport/transport.module';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
    imports: [TransportModule],
    controllers: [ChannelController],
    providers: [ChannelService],
    exports: [ChannelService]
})
export class ChannelModule {}

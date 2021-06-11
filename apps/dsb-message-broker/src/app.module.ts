import { Module } from '@nestjs/common';

import { ChannelModule } from './channel/channel.module';
import { MessageModule } from './message/message.module';

@Module({
    imports: [MessageModule, ChannelModule]
})
export class AppModule {}

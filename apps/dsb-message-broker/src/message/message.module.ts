import { Module } from '@nestjs/common';

import { TransportModule } from '../transport/transport.module';
import { MessageController } from './message.controller';
import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';

@Module({
    imports: [TransportModule],
    controllers: [MessageController],
    providers: [MessageService, MessageGateway]
})
export class MessageModule {}

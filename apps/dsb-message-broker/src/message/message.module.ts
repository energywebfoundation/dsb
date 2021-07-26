import { Module } from '@nestjs/common';

import { TransportModule } from '../transport/transport.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
    imports: [TransportModule],
    controllers: [MessageController],
    providers: [MessageService]
})
export class MessageModule {}

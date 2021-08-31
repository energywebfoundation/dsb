import { Module, Global } from '@nestjs/common';

import { TransportModule } from '../transport/transport.module';
import { AddressBookModule } from '../addressbook/addressbook.module';
import { TopicSchemaService } from './topic.schema.service';

@Global()
@Module({
    imports: [TransportModule, AddressBookModule],
    controllers: [],
    providers: [TopicSchemaService],
    exports: [TopicSchemaService]
})
export class UtilsModule {}

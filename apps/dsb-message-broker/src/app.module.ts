import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChannelModule } from './channel/channel.module';
import { MessageModule } from './message/message.module';
import * as Joi from '@hapi/joi';

@Module({
    imports: [
        MessageModule,
        ChannelModule,
        ConfigModule.forRoot({
            cache: true,
            isGlobal: true,
            validationSchema: Joi.object({ NATS_JS_URL: Joi.string().required() })
        })
    ]
})
export class AppModule {}

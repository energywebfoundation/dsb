import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';

import { ChannelModule } from './channel/channel.module';
import { HTTPLoggingInterceptor } from './httpLoggingInterceptor';
import { MessageModule } from './message/message.module';

@Module({
    imports: [
        MessageModule,
        ChannelModule,
        ConfigModule.forRoot({
            cache: true,
            isGlobal: true,
            validationSchema: Joi.object({
                NATS_JS_URL: Joi.string().optional().default('nats://localhost:4222'),
                PORT: Joi.number().optional().default(3000),
                WITH_SWAGGER: Joi.boolean().optional().default(true),
                JWT_SECRET: Joi.string().required()
            })
        }),
        AuthModule
    ],
    providers: [{ provide: APP_INTERCEPTOR, useClass: HTTPLoggingInterceptor }]
})
export class AppModule {}

import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';

import { ChannelModule } from './channel/channel.module';
import { HealthModule } from './health/health.module';
import { HTTPLoggingInterceptor } from './httpLoggingInterceptor';
import { MessageModule } from './message/message.module';

import { organizations } from './configs';
import { UtilsModule } from './utils/utils.module';
@Module({
    imports: [
        MessageModule,
        ChannelModule,
        HealthModule,
        ConfigModule.forRoot({
            cache: true,
            isGlobal: true,
            validationSchema: Joi.object({
                NATS_JS_URL: Joi.string().optional().default('nats://localhost:4222'),
                PORT: Joi.number().optional().default(3000),
                WEB3_URL: Joi.string().default('https://volta-rpc.energyweb.org/'),
                CACHE_SERVER_URL: Joi.string().default('https://identitycache-dev.energyweb.org'),
                WITH_SWAGGER: Joi.boolean().optional().default(true),
                JWT_SECRET: Joi.string().required(),
                PRIVATE_KEY: Joi.string().required(),
                MB_DID: Joi.string().required()
            }),
            load: [organizations]
        }),
        AuthModule,
        UtilsModule
    ],
    providers: [{ provide: APP_INTERCEPTOR, useClass: HTTPLoggingInterceptor }]
})
export class AppModule {}

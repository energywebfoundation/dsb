import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { LoginStrategy } from 'passport-did-auth';

@Injectable()
export class AuthStrategy extends PassportStrategy(LoginStrategy, 'login') {
    constructor(configService: ConfigService) {
        super({
            jwtSecret: Buffer.from(configService.get<string>('JWT_SECRET')),
            jwtSignOptions: {
                algorithm: 'HS256'
            },
            rpcUrl: configService.get<string>('WEB3_URL'),
            cacheServerUrl: configService.get<string>('CACHE_SERVER_URL'),
            acceptedRoles: [],
            privateKey: configService.get<string>('PRIVATE_KEY')
        });
    }
}

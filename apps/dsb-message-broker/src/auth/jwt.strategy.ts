import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req: Request) => {
                    if (req && req.cookies) {
                        return req.cookies.auth as string;
                    }
                    return undefined;
                }
            ]),
            ignoreExpiration: false,
            secretOrKey: Buffer.from(configService.get<string>('JWT_SECRET')),
            algorithms: ['HS256']
        });
    }

    async validate(payload: any) {
        return payload;
    }
}

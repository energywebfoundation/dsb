import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: any) => {
                    let token = null;
                    if (req && req.handshake && req.handshake.headers) {
                        const headers = req.handshake.headers;
                        if (headers.authorization && headers.authorization.startsWith('Bearer ')) {
                            token = headers.authorization.split(' ').pop();
                        }
                    }
                    if (req && req.cookies) {
                        token = req.cookies.auth as string;
                    }
                    return token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken()
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

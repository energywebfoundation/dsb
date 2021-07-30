import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthStrategy } from './auth.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
    providers: [AuthStrategy, JwtStrategy, AuthService],
    controllers: [AuthController]
})
export class AuthModule {}

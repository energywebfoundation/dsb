import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthStrategy } from './auth.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
    providers: [AuthStrategy, JwtStrategy],
    controllers: [AuthController]
})
export class AuthModule {}

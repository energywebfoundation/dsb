import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { TransportModule } from '../transport/transport.module';
import { HealthController } from './health.controller';

@Module({
    imports: [TerminusModule, TransportModule],
    controllers: [HealthController]
})
export class HealthModule {}

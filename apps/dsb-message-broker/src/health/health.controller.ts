import { ITransport } from '@energyweb/dsb-transport-core';
import { Controller, Get } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
@ApiTags('health')
export class HealthController {
    private transport: ITransport;

    constructor(private health: HealthCheckService, private readonly moduleRef: ModuleRef) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            async () => ({ transport: { status: this.transport.isConnected() ? 'up' : 'down' } })
        ]);
    }
}

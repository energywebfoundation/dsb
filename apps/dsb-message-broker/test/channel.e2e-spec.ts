import { HttpStatus, INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { request } from './request';
import { ChannelManagerService } from './channel-manager.service';
import { ChannelService } from '../src/channel/channel.service';
import { JwtAuthGuard } from '../src/auth/jwt.guard';

describe('ChannelController (e2e)', () => {
    let app: INestApplication;
    let channelManagerService: ChannelManagerService;

    const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';

    const authenticatedUser = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
        verifiedRoles: [
            {
                name: 'channelcreation',
                namespace: 'channelcreation.roles.dsb.apps.energyweb.iam.ewc'
            }
        ]
    };

    const authGuard: CanActivate = {
        canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            req.user = authenticatedUser;

            return true;
        }
    };

    before(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(authGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        const channelService = await app.resolve<ChannelService>(ChannelService);

        // TODO: use DI from Nest after fixing an issue where ChannelService cannot be found to inject
        channelManagerService = new ChannelManagerService(channelService);

        app.useLogger(['log', 'error']);

        await app.init();
    });

    after(async () => {
        await channelManagerService.remove(fqcn);
    });

    it('should create a channel', async () => {
        await request(app).post('/channel').send({ fqcn }).expect(HttpStatus.CREATED);
    });

    // TODO

    // it('should not create a channel without having channelcreation role in the org for the app', async () => {});

    // it('should not create a channel with missing fqcn', async () => {});

    // it('should not create a channel with invalid fqcn', async () => {});

    // it('should not create a channel with invalid metadata', async () => {});

    // it('should modify a channel', async () => {});

    // it('should not be able to modify a channel without having admin permission', async () => {});

    // it('should remove a channel', async () => {});

    // it('should not be able to remove a channel without having admin permission', async () => {});
});

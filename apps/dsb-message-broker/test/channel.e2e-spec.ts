import { HttpStatus, INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { request } from './request';
import { ChannelManagerService } from './channel-manager.service';
import { ChannelService } from '../src/channel/channel.service';
import { JwtAuthGuard } from '../src/auth/jwt.guard';
import { expect } from 'chai';

describe('ChannelController (e2e)', () => {
    let app: INestApplication;

    const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
    let channelManagerService: ChannelManagerService;

    const authenticatedUser1 = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
        verifiedRoles: [
            {
                name: 'channelcreation',
                namespace: 'channelcreation.roles.dsb.apps.energyweb.iam.ewc'
            }
        ]
    };
    const authenticatedUser2 = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
        verifiedRoles: [
            {
                name: 'channelcreation',
                namespace: 'channelcreation.roles.dsb.apps.energyweb.iam.ewc'
            },
            {
                name: 'user',
                namespace: 'user.roles.dsb.apps.energyweb.iam.ewc'
            }
        ]
    };
    const authenticatedUser3 = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237',
        verifiedRoles: [
            {
                name: 'user',
                namespace: 'user.roles.dsb.apps.energyweb.iam.ewc'
            }
        ]
    };
    const authenticatedUser4 = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237',
        verifiedRoles: [] as any[]
    };

    const authGuard: CanActivate = {
        canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            const userNo = req.get('User-No');
            if (userNo === '1') req.user = authenticatedUser1;
            if (userNo === '2') req.user = authenticatedUser2;
            if (userNo === '3') req.user = authenticatedUser3;
            if (userNo === '4') req.user = authenticatedUser4;
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
        try {
            await channelManagerService.remove(fqcn);
        } catch (error) {}
    });

    it('should not create a channel without channelcreation role', async () => {
        await request(app)
            .post('/channel')
            .send({ fqcn })
            .set('User-No', '3')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not create a channel with invalid fqcn', async () => {
        // not allowed characters
        await request(app)
            .post('/channel')
            .send({ fqcn: 'test!@#.channels.dsb.apps.energyweb.iam.ewc' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);

        // more than 16 character
        await request(app)
            .post('/channel')
            .send({ fqcn: 'test1234567890123.channels.dsb.apps.energyweb.iam.ewc' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not create a channel with invalid metadata', async () => {
        // invalid topics
        await request(app)
            .post('/channel')
            .send({ fqcn, topics: [{}] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid admins
        await request(app)
            .post('/channel')
            .send({ fqcn, admins: [] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid publishers
        await request(app)
            .post('/channel')
            .send({ fqcn, publishers: [] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid subscribers
        await request(app)
            .post('/channel')
            .send({ fqcn, subscribers: [] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid maxMsgAge
        await request(app)
            .post('/channel')
            .send({ fqcn, maxMsgAge: '' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid maxMsgSize
        await request(app)
            .post('/channel')
            .send({ fqcn, maxMsgSize: '' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create a channel', async () => {
        await request(app)
            .post('/channel')
            .send({ fqcn })
            .set('User-No', '1')
            .expect(HttpStatus.CREATED);
    });

    it('should not be able to modify a channel without having user role', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                publishers: [authenticatedUser3.did],
                subscribers: [authenticatedUser3.did]
            })
            .set('User-No', '1')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not be able to modify a channel without being admin', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                publishers: [authenticatedUser3.did],
                subscribers: [authenticatedUser3.did]
            })
            .set('User-No', '3')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should modify a channel', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                publishers: [authenticatedUser3.did],
                subscribers: [authenticatedUser3.did]
            })
            .set('User-No', '2')
            .expect(HttpStatus.OK);
    });

    it('should not be able to get accessible channels without having user role', async () => {
        await request(app).get('/channel/pubsub').set('User-No', '4').expect(HttpStatus.FORBIDDEN);
    });

    it('should not be able to get channel metadata without being publisher or subscriber', async () => {
        await request(app)
            .get(`/channel/${fqcn}`)
            .set('User-No', '2')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should get accessible channels', async () => {
        const channels = (
            await request(app).get('/channel/pubsub').set('User-No', '3').expect(HttpStatus.OK)
        ).body;

        const includesCreatedChannel = channels.some((channel: any) => channel.fqcn === fqcn);

        expect(includesCreatedChannel, 'it should include created channel').to.be.true;
    });

    it('should get channel metadata', async () => {
        const channel = (
            await request(app).get(`/channel/${fqcn}`).set('User-No', '3').expect(HttpStatus.OK)
        ).body;

        expect(channel).to.include({ fqcn }, 'fqcn should match');

        expect(channel).to.deep.include(
            { admins: ['did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596'] },
            'should have creator as admin'
        );

        expect(channel).to.deep.include(
            { publishers: ['did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237'] },
            'should have modified publishers'
        );

        expect(channel).to.deep.include(
            { subscribers: ['did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237'] },
            'should have modified subscribers'
        );
    });

    it('should not be able to remove a channel without having user role', async () => {
        await request(app)
            .delete(`/channel/${fqcn}`)
            .set('User-No', '1')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not be able to remove a channel without being admin', async () => {
        await request(app)
            .delete(`/channel/${fqcn}`)
            .set('User-No', '3')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should remove a channel', async () => {
        await request(app).delete(`/channel/${fqcn}`).set('User-No', '2').expect(HttpStatus.OK);
    });
});

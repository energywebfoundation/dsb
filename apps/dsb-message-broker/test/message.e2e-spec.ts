import { HttpStatus, INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PublishMessageDto } from '../src/message/dto/publish-message.dto';
import { AppModule } from '../src/app.module';
import { request } from './request';
import { ChannelManagerService } from './channel-manager.service';
import { ChannelService } from '../src/channel/channel.service';
import { MessageDto } from '../src/message/dto/message.dto';
import { expect } from 'chai';
import { JwtAuthGuard } from '../src/auth/jwt.guard';

describe('MessageController (e2e)', () => {
    let app: INestApplication;
    let channelManagerService: ChannelManagerService;

    const authenticatedUser = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
        verifiedRoles: [{ name: 'user', namespace: 'user.roles.dsb.apps.energyweb.iam.ewc' }]
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
        await channelManagerService.cleanUp();
    });

    it('should publish a message to existing channel', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        try {
            await channelManagerService.create({ fqcn });
        } catch (e) {}

        await request(app).post('/message').send(message).expect(HttpStatus.CREATED);
    });

    it('should not publish a message to missing channel', async () => {
        const fqcn = 'missing.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await request(app).post('/message').send(message).expect(HttpStatus.NOT_FOUND);
    });

    it('should be able to receive no messages if channel is empty', async () => {
        const fqcn = 'test200.channels.dsb.apps.energyweb.iam.ewc';
        await channelManagerService.create({ fqcn });

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(0);
            });
    });

    it('should be able to receive a message that was previously published', async () => {
        const fqcn = 'test300.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });
        await request(app).post('/message').send(message).expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(1);

                expect(messages[0].payload).to.be.equal(message.payload);
                expect(messages[0].signature).to.be.equal(message.signature);
                expect(messages[0].sender).to.be.equal(authenticatedUser.did);
            });
    });

    it('should be able to receive multiple messages that were previously published in FIFO order', async () => {
        const fqcn = 'test400.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '3' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=3`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(3);
                expect(messages[0].payload).to.be.equal('1');
                expect(messages[2].payload).to.be.equal('3');
            });
    });

    it('should be able to receive multiple messages that were previously published in FIFO order using 2 pull requests', async () => {
        const fqcn = 'test500.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '3' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=1`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(1);
                expect(messages[0].payload).to.be.equal('1');
            });

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=2`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(2);
                expect(messages[0].payload).to.be.equal('2');
                expect(messages[1].payload).to.be.equal('3');
            });
    });

    it('should be able to receive the message that contains the correlation id set by sender', async () => {
        const fqcn = 'test-correlation-id.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig',
            correlationId: 'id'
        };

        await channelManagerService.create({ fqcn });

        await request(app).post('/message').send(message).expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=3`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const [receivedMessage] = res.body as MessageDto[];

                expect(receivedMessage.correlationId).to.be.equal(message.correlationId);
            });
    });

    it('should receive single message when sending with same correlation id withing 2min dedupe window', async () => {
        const fqcn = 'test-message-dedupe.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig',
            correlationId: 'id'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=3`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const receivedMessages = res.body as MessageDto[];

                expect(receivedMessages).to.have.lengthOf(1);
                expect(receivedMessages[0].payload).to.be.equal('1');
            });
    });

    it('should be able to restart the consumer by using unique clientId', async () => {
        const fqcn = 'restart.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10&clientId=1`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(2);
            });

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10&clientId=2`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(2);
            });
    });
});

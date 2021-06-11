import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PublishMessageDto } from '../src/message/dto/publish-message.dto';
import { AppModule } from '../src/app.module';
import { request } from './request';
import { ChannelManagerService } from './channel-manager.service';
import { ChannelService } from '../src/channel/channel.service';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let channelManagerService: ChannelManagerService;

    before(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

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
        const fqcn = 'test.channel.test.apps.test.iam.ewc';
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
        const fqcn = 'missing.channel.test.apps.test.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await request(app).post('/message').send(message).expect(HttpStatus.BAD_REQUEST);
    });
});

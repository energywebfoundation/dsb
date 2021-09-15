import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Signer, utils, Wallet } from 'ethers';

import { AppModule } from '../src/app.module';
import { request } from './request';

import assert from 'assert';

describe('Root controller (e2e)', () => {
    let app: INestApplication;

    before(async function () {
        const privateKey = process.env.TEST_LOGIN_PK;
        if (!privateKey) {
            this.skip();
        }

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useLogger(['log', 'error']);

        await app.init();
    });

    it('should get 200 from root', function () {
        request(app).get('/').expect(HttpStatus.OK);
    });
});

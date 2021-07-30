import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Signer, utils, Wallet } from 'ethers';

import { AppModule } from '../src/app.module';
import { request } from './request';

describe('Auth controller (e2e)', () => {
    let app: INestApplication;

    const generateIdentity = async (signer: Signer) => {
        const header = {
            alg: 'ES256',
            typ: 'JWT'
        };

        const encodedHeader = utils.base64.encode(Buffer.from(JSON.stringify(header)));

        const address = await signer.getAddress();
        const did = `did:ethr:${address}`;

        const payload = {
            iss: did,
            claimData: {
                blockNumber: 999999999999
            }
        };

        const encodedPayload = utils.base64.encode(Buffer.from(JSON.stringify(payload)));

        const message = utils.arrayify(
            utils.keccak256(Buffer.from(`${encodedHeader}.${encodedPayload}`))
        );
        const sig = await signer.signMessage(message);
        const encodedSig = utils.base64.encode(Buffer.from(sig));

        return `${encodedHeader}.${encodedPayload}.${encodedSig}`;
    };

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

    it('should login', async function () {
        const privateKey = process.env.TEST_LOGIN_PK;
        if (!privateKey) {
            this.skip();
        }

        const user = new Wallet(privateKey);
        const identityToken = await generateIdentity(user);

        await request(app).post('/auth/login').send({ identityToken }).expect(HttpStatus.OK);
    });
});

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Signer, utils, Wallet } from 'ethers';

import { AppModule } from '../src/app.module';
import { request } from './request';

import assert from 'assert';

describe('Auth controller (e2e)', () => {
    let app: INestApplication;
    let identityToken: string;
    let userDID: string;

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

        const user = new Wallet(privateKey);
        identityToken = await generateIdentity(user);

        const userAddress = await user.getAddress();
        userDID = `did:ethr:${userAddress}`;
    });

    it('should login', function (done) {
        const privateKey = process.env.TEST_LOGIN_PK;
        if (!privateKey) {
            this.skip();
        }

        request(app)
            .post('/auth/login')
            .send({ identityToken })
            .expect(HttpStatus.OK)
            .then((response) => {
                const payload = response.body.address + response.body.did + userDID;
                const digest = utils.id(payload);
                const address = utils.recoverAddress(digest, response.body.signature);

                assert.equal(address, response.body.address);

                done();
            })
            .catch(done);
    });
});

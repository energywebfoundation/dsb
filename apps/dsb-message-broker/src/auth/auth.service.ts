import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initWithPrivateKeySigner } from 'iam-client-lib';
import { ApplicationError } from '../global.errors';

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name);

    constructor(private readonly configService: ConfigService) {}

    private readonly role = 'messagebroker.roles.dsb.apps.energyweb.iam.ewc';

    public async onModuleInit(): Promise<void> {
        const privateKey = this.configService.get<string>('PRIVATE_KEY');
        const mbDID = this.configService.get<string>('MB_DID');
        const rpcUrl = this.configService.get<string>('WEB3_URL');
        const cacheServerUrl = this.configService.get<string>('CACHE_SERVER_URL');
        const { signerService, connectToCacheServer } = await initWithPrivateKeySigner(
            privateKey,
            rpcUrl
        );
        const { cacheClient, connectToDidRegistry } = await connectToCacheServer();
        const { claimsService } = await connectToDidRegistry();

        try {
            if (!claimsService) {
                throw new Error('initiating claimserver error');
            }
        } catch (error) {
            throw new ApplicationError([
                'error in initializing connection to identity cache server',
                error.message
            ]);
        }

        if (mbDID !== signerService.did) {
            throw new ApplicationError(
                "Provided DID for the Message Broker doesn't correspond to PRIVATE_KEY"
            );
        }

        let claims;
        try {
            claims = await claimsService.getUserClaims({ did: signerService.did });
        } catch (error) {
            throw new ApplicationError([
                'error in getting claims from identity cache server',
                error.message
            ]);
        }

        const role = claims.find((claim) => claim.claimType === this.role);

        //TODO: Add proper role verification
        if (!role) {
            throw new ApplicationError([
                `Message Broker ${signerService.did} does not have "${this.role}" role.`,
                'Please check https://github.com/energywebfoundation/dsb#configuration for more details'
            ]);
        }
    }
}

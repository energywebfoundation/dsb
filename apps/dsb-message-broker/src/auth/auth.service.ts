import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAM, setCacheClientOptions } from 'iam-client-lib';
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

        try {
            setCacheClientOptions(73799, {
                url: cacheServerUrl
            });
        } catch (error) {
            console.log('1', error);
            if (error.message && error.message.indexOf('project id required') >= 0) {
                console.log('Temprary ignoring project ID');
            } else {
                throw new ApplicationError(['error in setCacheClientOptions', error.message]);
            }
        }

        const iam = new IAM({ rpcUrl, privateKey });
        let init;
        try {
            init = await iam.initializeConnection({ initCacheServer: true });
        } catch (error) {
            console.log('2', error);
            if (error.message && error.message.indexOf('project id required') >= 0) {
                console.log('Temprary ignoring project ID');
            } else {
                throw new ApplicationError([
                    'error in initializing connection to identity cache server',
                    error.message
                ]);
            }
        }

        if (mbDID !== init.did) {
            throw new ApplicationError(
                "Provided DID for the Message Broker doesn't correspond to PRIVATE_KEY"
            );
        }

        let claims;
        try {
            claims = await iam.getUserClaims({ did: init.did });
        } catch (error) {
            console.log('3', error);
            if (error.message && error.message.indexOf('project id required') >= 0) {
                console.log('Temprary ignoring project ID');
            } else {
                throw new ApplicationError([
                    'error in getting claims from identity cache server',
                    error.message
                ]);
            }
        }

        const role = claims.find((claim) => claim.claimType === this.role);

        //TODO: Add proper role verification
        if (!role) {
            throw new ApplicationError([
                `Message Broker ${init.did} does not have "${this.role}" role.`,
                'Please check https://github.com/energywebfoundation/dsb#configuration for more details'
            ]);
        }
    }
}

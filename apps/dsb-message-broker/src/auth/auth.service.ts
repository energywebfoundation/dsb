import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAM, setCacheClientOptions } from 'iam-client-lib';

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

        setCacheClientOptions(73799, {
            url: cacheServerUrl
        });

        const iam = new IAM({ rpcUrl, privateKey });
        let init;
        try {
            init = await iam.initializeConnection({ initCacheServer: true });
        } catch (error) {
            this.logger.error({
                message: 'error in initializing connection to identity cache server'
            });
            process.exit(1);
        }

        if (mbDID !== init.did) {
            this.logger.error({
                message: "Provided DID for the Message Broker doesn't correspond to PRIVATE_KEY"
            });
            process.exit(1);
        }

        let claims;
        try {
            claims = await iam.getUserClaims({ did: init.did });
        } catch (error) {
            this.logger.error({ message: 'error in getting claims from identity cache server' });
            process.exit(1);
        }

        const role = claims.find((claim) => claim.claimType === this.role);

        //TODO: Add proper role verification
        if (!role) {
            this.logger.error({
                message: `Message Broker ${init.did} does not have "${this.role}" role. Please check https://github.com/energywebfoundation/dsb#configuration for more details`
            });
            process.exit(1);
        }
    }
}

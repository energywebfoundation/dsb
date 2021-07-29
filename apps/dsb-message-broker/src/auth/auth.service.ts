import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAM } from 'iam-client-lib';

@Injectable()
export class AuthService implements OnModuleInit {
    constructor(private readonly configService: ConfigService) {}

    private readonly role = 'messagebroker.roles.dsb.apps.energyweb.iam.ewc';

    public async onModuleInit(): Promise<void> {
        const privateKey = this.configService.get<string>('PRIVATE_KEY');
        const rpcUrl = this.configService.get<string>('WEB3_URL');

        const iam = new IAM({ rpcUrl, privateKey });
        const init = await iam.initializeConnection({ initCacheServer: true });

        const claims = await iam.getUserClaims({ did: init.did });

        const role = claims.find((claim) => claim.claimType === this.role);

        //TODO: Add proper role verification
        if (!role) {
            throw new Error(
                `Message Broker ${init.did} does not have "${this.role}" role. Please check https://github.com/energywebfoundation/dsb#configuration for more details`
            );
        }
    }
}
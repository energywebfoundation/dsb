import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginReturnDataDTO } from './login-return-data.dto';
import { ethers } from 'ethers';

@Injectable()
export class LoginService {
    constructor(private readonly configService: ConfigService) {}

    public async mbIdentifiers(jwtToken?: string): Promise<Partial<LoginReturnDataDTO>> {
        const jwtEncodedPayload = jwtToken.split('.')[1];
        const jwtDecodedPayload = ethers.utils.base64.decode(jwtEncodedPayload);
        const jwtPayload = JSON.parse(String.fromCharCode.apply(null, jwtDecodedPayload));
        const userDID = jwtPayload?.iss || 'did:ethr:0x';

        const did = this.configService.get<string>('MB_DID');

        const privateKey = this.configService.get<string>('PRIVATE_KEY');
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;

        const payload = address + did + userDID;
        const digest = ethers.utils.id(payload);
        const signingKey = new ethers.utils.SigningKey(wallet.privateKey);
        const signedDigest = signingKey.signDigest(digest);
        const signature = ethers.utils.joinSignature(signedDigest);

        return {
            did,
            address,
            signature
        };
    }
}

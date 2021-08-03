import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginReturnDataDTO {
    token: string;

    @ApiProperty({
        type: String,
        description:
            'DID of messagebroker which is the DID identifier corresponding to env.PRIVATE_KEY'
    })
    @IsString()
    @IsNotEmpty()
    did: string;

    @ApiProperty({
        type: String,
        description: 'address of the env.PRIVATE_KEY for signature recovery purposes'
    })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({
        type: String,
        description:
            'the compact hex signature which is ECDSA hash(address of privatekey+messagebrokerDID+userDID)'
    })
    @IsString()
    @IsNotEmpty()
    signature: string;
}

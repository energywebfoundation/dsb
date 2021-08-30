import { ApiProperty } from '@nestjs/swagger';

export class LoginReturnDataDTO {
    @ApiProperty({
        type: String,
        description: 'Bearer token'
    })
    token: string;

    @ApiProperty({
        type: String,
        description: 'DID of the Message Broker'
    })
    did: string;

    @ApiProperty({
        type: String,
        description: 'Address of the Message Broker for signature recovery purposes'
    })
    address: string;

    @ApiProperty({
        type: String,
        description: 'The compact hex ECDSA signature of keccak256(address+did+userDID)'
    })
    signature: string;
}

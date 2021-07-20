import { ApiProperty } from '@nestjs/swagger';

export class MessageDTO {
    @ApiProperty({
        type: String,
        description: 'Message id',
        example: 'msg-#1'
    })
    id: string;

    @ApiProperty({
        type: String,
        description: 'Any stringified payload like JSON, BASE64 etc',
        example: '{"data": "test"}'
    })
    payload: string;

    @ApiProperty({
        type: String,
        description: 'Sender of the message',
        example: 'did:ethr:0x57618002cF07E53De4a5abf1e8735882169f2efB'
    })
    sender: string;

    @ApiProperty({ type: String, description: 'Compacted EcdsaSecp256k1Signature2019' })
    signature: string;
}

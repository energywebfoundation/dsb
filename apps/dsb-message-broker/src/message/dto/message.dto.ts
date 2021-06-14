import { ApiProperty } from '@nestjs/swagger';

export class MessageDTO {
    @ApiProperty({
        type: String,
        description: 'Any stringified payload like JSON, BASE64 etc',
        example: '{"data": "test"}'
    })
    payload: string;

    @ApiProperty({
        type: String,
        description: 'Sender of the message',
        example: '{"data": "test"}'
    })
    sender: string;

    @ApiProperty({ type: String, description: 'Compacted EcdsaSecp256k1Signature2019' })
    signature: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageDto {
    @ApiProperty({
        type: String,
        description: 'Message id',
        example: 'msg-#1'
    })
    id: string;

    @ApiProperty({
        type: String,
        description: 'Message topic',
        example: 'default'
    })
    topic: string;

    @ApiProperty({
        type: String,
        description: 'Any stringified payload like JSON, BASE64 etc',
        example: '{"data": "testData"}'
    })
    payload: string;

    @ApiProperty({ type: String, description: 'Compacted EcdsaSecp256k1Signature2019' })
    signature: string;

    @ApiProperty({
        type: String,
        description: 'Sender of the message',
        example: 'did:ethr:0x57618002cF07E53De4a5abf1e8735882169f2efB'
    })
    sender: string;

    @ApiProperty({ type: Number, description: 'Message published timestamp in nanoseconds' })
    timestampNanos: number;

    @ApiPropertyOptional({
        type: String,
        example: 'b5e2eece-b39f-486d-9513-4cadc9a59a18',
        description: 'Correlation id used for message de duplication and correlation purposes'
    })
    correlationId?: string;
}

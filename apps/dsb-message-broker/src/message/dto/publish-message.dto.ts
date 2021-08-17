import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishMessageDto {
    @ApiProperty({
        type: String,
        description: 'Fully qualified channel name (fcqn)',
        example: 'test.channels.testapp.apps.testorganization.iam.ewc'
    })
    @IsString()
    @IsNotEmpty()
    fqcn: string;

    @ApiProperty({
        type: String,
        description: 'Topic name for the message (default value is "default")'
    })
    @IsString()
    @IsOptional()
    topic?: string;

    @ApiProperty({
        type: String,
        description: 'Any stringified payload like JSON, BASE64 etc',
        example: '{"data": "test"}'
    })
    @IsString()
    @IsNotEmpty()
    payload: string;

    @ApiProperty({ type: String, description: 'Compacted EcdsaSecp256k1Signature2019' })
    @IsString()
    @IsNotEmpty()
    signature: string;
}

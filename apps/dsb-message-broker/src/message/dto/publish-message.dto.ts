import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishMessageDto {
    @ApiProperty({
        type: 'string',
        required: true,
        format: '{channel_name}.channels.{app_name}.apps.{organization_name}.iam.ewc',
        description: 'Fully Qualified Channel Name (fcqn)'
    })
    @IsString()
    @IsNotEmpty()
    fqcn: string;

    @ApiProperty({
        type: String,
        required: false,
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

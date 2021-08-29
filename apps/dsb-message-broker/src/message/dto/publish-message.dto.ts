import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublishMessageDto {
    @ApiProperty({
        type: String,
        format: '{channel_name}.channels.{app_name}.apps.{organization_name}.iam.ewc',
        example: 'testChannel.channels.dsb.apps.energyweb.iam.ewc',
        description: 'Fully Qualified Channel Name (fcqn)'
    })
    @IsString()
    @IsNotEmpty()
    fqcn: string;

    @ApiPropertyOptional({
        type: String,
        example: 'testTopic',
        description: 'Topic name of the channel (default value is "default")'
    })
    @IsString()
    @IsOptional()
    topic?: string;

    @ApiProperty({
        type: String,
        description: 'Any stringified payload like JSON, BASE64 etc',
        example: '{"data": "testData"}'
    })
    @IsString()
    @IsNotEmpty()
    payload: string;

    @ApiProperty({ type: String, description: 'Compacted EcdsaSecp256k1Signature2019' })
    @IsString()
    @IsNotEmpty()
    signature: string;
}

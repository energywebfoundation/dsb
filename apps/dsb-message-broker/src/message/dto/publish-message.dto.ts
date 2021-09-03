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

    @ApiPropertyOptional({
        type: String,
        example: 'b5e2eece-b39f-486d-9513-4cadc9a59a18',
        description: 'Correlation id used for message de duplication and correlation purposes'
    })
    @IsString()
    @IsOptional()
    correlationId?: string;

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

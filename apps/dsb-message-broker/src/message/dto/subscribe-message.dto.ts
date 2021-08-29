import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeMessageDto {
    @ApiProperty({
        type: String,
        format: '{channel_name}.channels.{app_name}.apps.{organization_name}.iam.ewc',
        example: 'testChannel.channels.dsb.apps.energyweb.iam.ewc',
        description: 'Fully Qualified Channel Name (fcqn)'
    })
    @IsString()
    @IsNotEmpty()
    fqcn: string;

    @ApiProperty({
        type: String,
        example: 'testTopic',
        description: 'Topic name of the channel (default value is "default")'
    })
    @IsString()
    @IsNotEmpty()
    topic: string;
}

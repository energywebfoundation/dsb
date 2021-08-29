import { IsDefined, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReadChannelDto {
    @ApiProperty({
        name: 'fqcn',
        type: String,
        format: '{channel_name}.channels.{app_name}.apps.{organization_name}.iam.ewc',
        example: 'testChannel.channels.dsb.apps.energyweb.iam.ewc',
        description: 'Fully Qualified Channel Name (fcqn)'
    })
    @IsDefined()
    @IsString()
    fqcn: string;
}

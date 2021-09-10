import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class PullMessageDto {
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
        name: 'amount',
        type: String,
        example: '100',
        description: 'Amount of messages to be returned in the request, default value is 100'
    })
    @IsString()
    @IsOptional()
    amount?: string;

    @ApiPropertyOptional({
        name: 'from',
        type: String,
        example: '2021-09-06T00:00:00Z',
        description: 'Rewinds the channel and retruns messages from given point in time'
    })
    @IsString()
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({
        name: 'clientId',
        type: String,
        example: 'default',
        description: 'Id of the persistent client, default value is ``'
    })
    @IsString()
    @IsOptional()
    clientId?: string;
}

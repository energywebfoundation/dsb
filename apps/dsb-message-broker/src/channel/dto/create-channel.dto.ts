import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChannelDto {
    @ApiProperty({
        type: String,
        description: 'Fully qualified channel name (fcqn)',
        example: 'test.channels.testapp.apps.testorganization.iam.ewc'
    })
    @IsString()
    @IsNotEmpty()
    fqcn: string;

    @ApiProperty({
        type: Object,
        description: 'Array of topics that is available in the channel'
    })
    @IsOptional()
    topics?: {
        namespace: string;
        schemaType: 'json' | 'xml' | 'JSON' | 'XML';
        schema: string;
    }[];

    @ApiProperty({
        type: Array,
        description:
            'Array of DIDs and roles that have permision to publish messages to the channel. If it is ommited, any user with "user" role can publish messages to the channel.'
    })
    @IsOptional()
    publishers?: string[];

    @ApiProperty({
        type: Array,
        description:
            'Array of DIDs and roles that have permision to subscribe to the channel. If it is ommited, any user with "user" role can subscribe to the channel.'
    })
    @IsOptional()
    subscribers?: string[];

    @ApiProperty({
        type: Number,
        description: 'Maximum age of any message in the channel, expressed in nanoseconds.'
    })
    @IsOptional()
    maxMsgAge?: number;

    @ApiProperty({
        type: Number,
        description: 'Maximum size of any message in the channel, expressed in bytes.'
    })
    @IsOptional()
    maxMsgSize?: number;
}

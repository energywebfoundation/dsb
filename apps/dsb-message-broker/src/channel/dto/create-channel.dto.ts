import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JSONSchemaType } from 'ajv';

export class CreateChannelDto {
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
        type: 'object',
        properties: {
            namespace: {
                type: 'string'
            },
            schema: {
                type: 'string | JSONSchemaType'
            }
        },
        required: false,
        description: 'Array of topic objects that determines topics for messages.'
    })
    @IsOptional()
    topics?: {
        namespace: string;
        schema: JSONSchemaType<any> | string;
    }[];

    @ApiProperty({
        isArray: true,
        required: false,
        description:
            'Array of DIDs that have permision to edit the channel. If it is ommited, creator of the channel will be the default admin.'
    })
    @IsOptional()
    admins?: string[];

    @ApiProperty({
        isArray: true,
        required: false,
        description:
            'A mixed array of DIDs and roles that have permision to publish messages to the channel. If it is ommited, any user with "user" role can publish messages to the channel.'
    })
    @IsOptional()
    publishers?: string[];

    @ApiProperty({
        isArray: true,
        required: false,
        description:
            'A mixed array of DIDs and roles that have permision to subscribe to the channel. If it is ommited, any user with "user" role can subscribe to the channel.'
    })
    @IsOptional()
    subscribers?: string[];

    @ApiProperty({
        type: 'number',
        required: false,
        description: 'Maximum age of any message in the channel, expressed in nanoseconds.'
    })
    @IsOptional()
    maxMsgAge?: number;

    @ApiProperty({
        type: 'number',
        required: false,
        description: 'Maximum size of any message in the channel, expressed in bytes.'
    })
    @IsOptional()
    maxMsgSize?: number;
}

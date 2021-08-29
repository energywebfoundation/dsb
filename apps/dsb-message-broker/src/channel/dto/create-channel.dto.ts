import {
    IsString,
    IsInt,
    IsArray,
    IsDefined,
    IsOptional,
    ArrayNotEmpty,
    ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JSONSchemaType } from 'ajv';

class Topic {
    @IsDefined()
    @IsString()
    namespace: string;

    @IsDefined()
    schema: string | Record<string, unknown>;
}

export class CreateChannelDto {
    @ApiProperty({
        type: String,
        format: '{channel_name}.channels.{app_name}.apps.{organization_name}.iam.ewc',
        example: 'testChannel.channels.dsb.apps.energyweb.iam.ewc',
        description: 'Fully Qualified Channel Name (fcqn)'
    })
    @IsDefined()
    @IsString()
    fqcn: string;

    @ApiPropertyOptional({
        properties: {
            namespace: {
                type: 'string'
            },
            schema: {
                type: 'string | JSONSchemaType'
            }
        },
        required: false,
        description: 'Array of topic objects that determines topics for messages.',
        example: [
            {
                namespace: 'testTopic',
                schema: '{"type": "object","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
            }
        ]
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => Topic)
    topics?: {
        namespace: string;
        schema: JSONSchemaType<any> | string;
    }[];

    @ApiPropertyOptional({
        description:
            'Array of DIDs that have permision to edit the channel. If it is ommited, creator of the channel will be the default admin.',
        example: ['did:ethr:0x5aEa5Bf5c5b341A0BFhryv5b51b77Fb9807F1b52']
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    admins?: string[];

    @ApiPropertyOptional({
        description:
            'A mixed array of DIDs and roles that have permision to publish messages to the channel. If it is ommited, any user with "user" role can publish messages to the channel.',
        example: [
            'did:ethr:0x5aEa5Bf5c5b341A0BFhryv5b51b77Fb9807F1b52',
            'user.roles.dsb.apps.energyweb.iam.ewc'
        ]
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    publishers?: string[];

    @ApiPropertyOptional({
        description:
            'A mixed array of DIDs and roles that have permision to subscribe to the channel. If it is ommited, any user with "user" role can subscribe to the channel.',
        example: [
            'did:ethr:0x5aEa5Bf5c5b341A0BFhryv5b51b77Fb9807F1b52',
            'user.roles.dsb.apps.energyweb.iam.ewc'
        ]
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    subscribers?: string[];

    @ApiPropertyOptional({
        type: Number,
        description: 'Maximum age of any message in the channel, expressed in nanoseconds.',
        example: 86400000000
    })
    @IsOptional()
    @IsInt()
    maxMsgAge?: number;

    @ApiPropertyOptional({
        type: Number,
        description: 'Maximum size of any message in the channel, expressed in bytes.',
        example: 1000000
    })
    @IsOptional()
    @IsInt()
    maxMsgSize?: number;
}

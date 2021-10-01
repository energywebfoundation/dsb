import {
    IsString,
    IsInt,
    IsArray,
    IsDefined,
    IsOptional,
    ArrayNotEmpty,
    ValidateNested,
    Max,
    IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JSONSchemaType } from 'ajv';

enum SchemaType {
    'JSD-7',
    'XSD'
}

class Topic {
    @IsDefined()
    @IsString()
    namespace: string;

    @IsOptional()
    @IsEnum(SchemaType)
    schemaType: SchemaType;

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
            shcemaType: {
                description: 'Values are JSD-7(JSON Schema Draft-7) and XSD(XML Schema Definition)',
                default: 'JSD-7',
                type: 'enum'
            },
            schema: {
                type: 'string | JSONSchemaType'
            }
        },
        description: 'Array of topic objects that determines topics for messages.',
        example: [
            {
                namespace: 'testTopic',
                schemaType: 'JSD-7',
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
            'Array of DIDs that have permission to edit the channel. If it is omitted, creator of the channel will be the default admin.',
        example: ['did:ethr:0x5aEa5Bf5c5b341A0BFhryv5b51b77Fb9807F1b52']
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    admins?: string[];

    @ApiPropertyOptional({
        description:
            'A mixed array of DIDs and roles that have permission to publish messages to the channel. If it is omitted, any user with "user" role can publish messages to the channel.',
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
            'A mixed array of DIDs and roles that have permission to subscribe to the channel. If it is omitted, any user with "user" role can subscribe to the channel.',
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
        example: 86400000000000
    })
    @IsOptional()
    @IsInt()
    maxMsgAge?: number;

    @ApiPropertyOptional({
        type: Number,
        description:
            'Maximum size of any message in the channel, expressed in bytes. Maximum value is 8388608 bytes (8Mb)',
        default: 1048576,
        example: 1048576,
        maximum: 8388608
    })
    @IsOptional()
    @IsInt()
    @Max(8388608) //8Mb
    maxMsgSize?: number;
}

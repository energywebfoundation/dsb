import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReadChannelMetadataDto {
    @ApiProperty({
        type: String,
        description: 'Fully qualified channel name (fcqn)',
        example: 'test.channels.testapp.apps.testorganization.iam.ewc'
    })
    @IsString()
    @IsNotEmpty()
    fqcn: string;
}

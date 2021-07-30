import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDataDTO {
    @ApiProperty({
        type: String,
        description: 'ES256 signed JWT token'
    })
    @IsString()
    @IsNotEmpty()
    identityToken: string;
}

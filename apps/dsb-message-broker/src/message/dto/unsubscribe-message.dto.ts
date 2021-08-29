import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnsubscribeMessageDto {
    @ApiProperty({
        type: Number,
        description: 'Subscription id (returned from subscription request)'
    })
    @IsNumber()
    @IsNotEmpty()
    id: number;
}

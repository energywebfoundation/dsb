import { ChannelNotFoundError } from '@energyweb/dsb-transport-core';
import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Post,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

import { PublishMessageDto } from './dto/publish-message.dto';
import { MessageService } from './message.service';

@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@Controller('message')
export class MessageController {
    constructor(private readonly messageService: MessageService) {}
    private readonly logger = new Logger(MessageController.name);

    @Post()
    @ApiBody({ type: PublishMessageDto })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: 'Publish message'
    })
    public async publish(@Body() message: PublishMessageDto): Promise<string> {
        try {
            //TODO: change sender to authenticated DID of the sender
            const id = await this.messageService.publish('sender1', message);
            return id;
        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof ChannelNotFoundError) {
                throw new BadRequestException({ message: error.message });
            }

            throw new InternalServerErrorException({
                message: `Unable to publish a message due an unknown error`
            });
        }
    }
}

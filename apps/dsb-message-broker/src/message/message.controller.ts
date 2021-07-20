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
    Param,
    Post,
    Query,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MessageDTO } from './dto/message.dto';

import { PublishMessageDto } from './dto/publish-message.dto';
import { MessageService } from './message.service';

@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@Controller('message')
export class MessageController {
    private readonly logger = new Logger(MessageController.name);
    private readonly DEFAULT_AMOUNT = 100;

    constructor(private readonly messageService: MessageService) {}

    @Post()
    @ApiBody({ type: PublishMessageDto })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: 'Message id that is local to fqcn'
    })
    public async publish(@Body() message: PublishMessageDto): Promise<string> {
        try {
            //TODO: change sender to authenticated DID of the sender
            const id = await this.messageService.publish('sender1', message);
            return `msg-#${id}`;
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

    @Get()
    @ApiQuery({
        name: 'fqcn',
        required: true,
        description: 'Fully qualified channel name (fqcn)',
        example: 'test.channels.testapp.apps.testorganization.iam.ewc'
    })
    @ApiQuery({
        name: 'amount',
        required: false,
        description: 'Amount of messages to be returned in the request, default value is 100',
        example: '1000'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: [MessageDTO],
        description: 'Pull and returns messages from given channel'
    })
    public async getNewFromChannel(
        @Query('fqcn') fqcn: string,
        @Query('amount') amount: string
    ): Promise<MessageDTO[]> {
        return this.messageService.pull(fqcn, 'client1', parseInt(amount) ?? this.DEFAULT_AMOUNT);
    }
}

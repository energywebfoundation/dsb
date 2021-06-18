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
    Query,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
    UseGuards
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserDecorator } from '../auth/user.decorator';
import { MessageDTO } from './dto/message.dto';
import { PublishMessageDto } from './dto/publish-message.dto';
import { MessageService } from './message.service';

@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('message')
export class MessageController {
    private readonly logger = new Logger(MessageController.name);
    private readonly DEFAULT_AMOUNT = 100;

    constructor(private readonly messageService: MessageService) {}

    @Post()
    @Roles('user.roles.dsb.apps.energyweb.iam.ewc')
    @ApiBody({ type: PublishMessageDto })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: 'Message id that is local to fqcn'
    })
    public async publish(
        @UserDecorator() user: any,
        @Body() message: PublishMessageDto
    ): Promise<string> {
        try {
            const id = await this.messageService.publish(user.did, message);
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
    @Roles('user.roles.dsb.apps.energyweb.iam.ewc')
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
        example: '100'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: [MessageDTO],
        description: 'Pull and returns messages from given channel'
    })
    public async getNewFromChannel(
        @UserDecorator() user: any,
        @Query('fqcn') fqcn: string,
        @Query('amount') amount: string
    ): Promise<MessageDTO[]> {
        try {
            const result = await this.messageService.pull(
                fqcn,
                user.did,
                parseInt(amount) ?? this.DEFAULT_AMOUNT
            );
            return result;
        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof ChannelNotFoundError) {
                throw new BadRequestException({ message: error.message });
            }
        }
    }
}

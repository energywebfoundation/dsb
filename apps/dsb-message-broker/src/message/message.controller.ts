import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Logger,
    Post,
    Query,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiQuery,
    ApiResponse,
    ApiTags,
    ApiOperation
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { Role } from '../auth/role.decorator';
import { DynamicRolesGuard } from '../auth/dynamic.roles.guard';
import { UserDecorator } from '../auth/user.decorator';

import { PublishMessageDto, MessageDto } from './dto';
import { MessageService } from './message.service';
import { MessageQueryPipe } from './message.query.pipe';
import { HttpMessageErrorHandler } from './error.handler';
import { FqcnValidationPipe } from '../utils/fqcn.validation.pipe';

@Controller('message')
@UseGuards(JwtAuthGuard, DynamicRolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@ApiTags('message')
@ApiBearerAuth('access-token')
export class MessageController {
    private readonly logger = new Logger(MessageController.name);
    private readonly DEFAULT_AMOUNT = 100;

    constructor(private readonly messageService: MessageService) {}

    @Post()
    @Role('user')
    @ApiBody({ type: PublishMessageDto })
    @ApiOperation({
        description: 'Pushes a message to a topic in a channel.'
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: 'Published message ID in the specified channel'
    })
    public async publish(
        @UserDecorator() user: any,
        @Body(FqcnValidationPipe) message: PublishMessageDto
    ): Promise<string> {
        try {
            const id = await this.messageService.publish(
                message,
                user.did,
                user.verifiedRoles.map((role: any) => role.namespace)
            );
            return `msg-#${id}`;
        } catch (error) {
            this.logger.error(error.message);
            HttpMessageErrorHandler(error);
        }
    }

    @Get()
    @Role('user')
    @ApiQuery({
        name: 'fqcn',
        required: true,
        description: 'Fully Qualified Channel Name (fqcn)',
        example: 'testChannel.channels.dsb.apps.energyweb.iam.ewc'
    })
    @ApiQuery({
        name: 'topic',
        required: false
        // description: 'Fully Qualified Channel Name (fqcn)',
        // example: 'testChannel.channels.dsb.apps.energyweb.iam.ewc'
    })
    @ApiQuery({
        name: 'amount',
        required: false,
        description: 'Amount of messages to be returned in the request, default value is 100',
        example: '100'
    })
    @ApiQuery({
        name: 'from',
        required: false,
        description: 'Rewinds the channel and retruns messages from given point in time',
        example: '2021-09-06T00:00:00.000Z'
    })
    @ApiQuery({
        name: 'clientId',
        required: false,
        description: 'Id of the persistent client, default value is ``',
        example: 'default'
    })
    @ApiOperation({
        description: 'Pulls new messages from the channel.'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: [MessageDto],
        description: 'Array of pulled messages from a given channel'
    })
    public async getNewFromChannel(
        @UserDecorator() user: any,
        @Query(FqcnValidationPipe, MessageQueryPipe)
        query: { fqcn: string; topic?: string; amount?: string; from?: string; clientId?: string }
    ): Promise<MessageDto[]> {
        try {
            const messages = await this.messageService.pull(
                query.fqcn,
                query.topic,
                parseInt(query.amount) ?? this.DEFAULT_AMOUNT,
                query.from,
                query.clientId,
                user.did,
                user.verifiedRoles.map((role: any) => role.namespace)
            );
            return messages;
        } catch (error) {
            this.logger.error(error.message);
            HttpMessageErrorHandler(error);
        }
    }
}

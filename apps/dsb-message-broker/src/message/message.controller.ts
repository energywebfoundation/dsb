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
import { MessageDTO } from './dto/message.dto';
import { PublishMessageDto } from './dto/publish-message.dto';
import { MessageService } from './message.service';
import { messageErrorHandler } from './error.handler';

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
        description: 'Message id that is local to fqcn'
    })
    public async publish(
        @UserDecorator() user: any,
        @Body() message: PublishMessageDto
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
            messageErrorHandler(error);
        }
    }

    @Get()
    @Role('user')
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
    @ApiOperation({
        description: 'Pulls new message from a topic in a channel.'
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
            const messages = await this.messageService.pull(
                fqcn,
                parseInt(amount) ?? this.DEFAULT_AMOUNT,
                user.did,
                user.verifiedRoles.map((role: any) => role.namespace)
            );
            return messages;
        } catch (error) {
            this.logger.error(error.message);
            messageErrorHandler(error);
        }
    }
}

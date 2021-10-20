import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
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

import { PublishMessageDto, PullMessageDto, MessageDto } from './dto';
import { MessageService } from './message.service';
import { FqcnValidationPipe } from '../utils/fqcn.validation.pipe';
import { MessageInterceptor } from './message.interceptor';

@Controller('message')
@UseGuards(JwtAuthGuard, DynamicRolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@UseInterceptors(MessageInterceptor)
@ApiTags('message')
@ApiBearerAuth('access-token')
export class MessageController {
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
        const id = await this.messageService.publish(
            message,
            user.did,
            user.verifiedRoles.map((role: any) => role.namespace)
        );
        return `msg-#${id}`;
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
        name: 'amount',
        required: false,
        description: 'Amount of messages to be returned in the request, default value is 100',
        example: '100'
    })
    @ApiQuery({
        name: 'from',
        required: false,
        description: 'Rewinds the channel and retruns messages from given point in time',
        example: '2021-09-06T00:00:00Z'
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
        @Query(FqcnValidationPipe)
        query: PullMessageDto
    ): Promise<MessageDto[]> {
        const messages = await this.messageService.pull(
            query.fqcn,
            parseInt(query.amount) ?? this.DEFAULT_AMOUNT,
            query.from ?? '',
            query.clientId ?? '',
            user.did,
            user.verifiedRoles.map((role: any) => role.namespace)
        );
        return messages;
    }
}

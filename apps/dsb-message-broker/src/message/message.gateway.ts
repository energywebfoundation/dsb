import {
    ClassSerializerInterceptor,
    Logger,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
    ValidationError
} from '@nestjs/common';
import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtAuthGuard, Role, DynamicRolesGuard, UserDecorator } from '../auth';

import { MessageService } from './message.service';
import { PublishMessageDto, SubscribeMessageDto, UnsubscribeMessageDto } from './dto';
import { WsValidationErrorHandler, WsMessageErrorHandler } from './error.handler';

function gatewayOptions() {
    // http://localhost:5500 is the origin of socket.io client used for testing ws functionality
    return {
        namespace: 'message',
        cors:
            process.env.NODE_ENV?.toLowerCase().trim() === 'development'
                ? { origin: 'http://localhost:5500', methods: ['GET', 'POST'], credentials: true }
                : false
    };
}

@WebSocketGateway(gatewayOptions())
@UseGuards(JwtAuthGuard, DynamicRolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(
    new ValidationPipe({
        exceptionFactory: (errors: ValidationError[]) =>
            errors.forEach((error: ValidationError) => WsValidationErrorHandler(error))
    })
)
export class MessageGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(MessageGateway.name);

    @WebSocketServer()
    readonly server: Server;

    constructor(private readonly messageService: MessageService) {}

    afterInit(server: Server) {
        this.messageService.setWsServer(server);
    }

    handleConnection(socket: Socket) {
        try {
            this.messageService.onConnection(socket.id);
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    handleDisconnect(socket: Socket) {
        try {
            this.messageService.onDisconnect(socket.id);
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    @Role('user')
    @SubscribeMessage('OutgoingMessage')
    public async publish(
        @UserDecorator() user: any,
        @MessageBody() message: PublishMessageDto
    ): Promise<WsResponse<string>> {
        try {
            const id = await this.messageService.publish(
                message,
                user.did,
                user.verifiedRoles.map((role: any) => role.namespace)
            );

            return { event: 'OutgoingMessage', data: `msg-#${id}` };
        } catch (error) {
            this.logger.error(error.message);
            WsMessageErrorHandler(error);
        }
    }

    @Role('user')
    @SubscribeMessage('IncomingMessage')
    public async subscribe(
        @ConnectedSocket() socket: Socket,
        @UserDecorator() user: any,
        @MessageBody() subscribeDto: SubscribeMessageDto
    ): Promise<WsResponse<string>> {
        try {
            const subId = await this.messageService.subscribe(
                subscribeDto.fqcn,
                subscribeDto.topic,
                user.did,
                user.verifiedRoles.map((role: any) => role.namespace),
                socket.id
            );

            return { event: 'IncomingMessage', data: `sub-#${subId}` };
        } catch (error) {
            this.logger.error(error.message);
            WsMessageErrorHandler(error);
        }
    }

    @Role('user')
    @SubscribeMessage('Unsubscribe')
    public async unsubscribe(
        @ConnectedSocket() socket: Socket,
        @MessageBody() unsubscribeDto: UnsubscribeMessageDto
    ): Promise<WsResponse<string>> {
        try {
            this.messageService.unsubscribe(unsubscribeDto.id, socket.id);

            return { event: 'Unsubscribe', data: 'done' };
        } catch (error) {
            this.logger.error(error.message);
            WsMessageErrorHandler(error);
        }
    }
}

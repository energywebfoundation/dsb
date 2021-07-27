import {
    ChannelAlreadyCreatedError,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';
import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Post,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
    ServiceUnavailableException
} from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@Controller('channel')
export class ChannelController {
    constructor(private readonly channelService: ChannelService) {}
    private readonly logger = new Logger(ChannelController.name);

    @Post()
    @ApiBody({ type: CreateChannelDto })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: 'Creates a channel'
    })
    public async create(@Body() channel: CreateChannelDto): Promise<string> {
        try {
            const id = await this.channelService.create(channel);
            return id;
        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof ChannelAlreadyCreatedError) {
                throw new BadRequestException({ message: error.message });
            }

            if (error instanceof TransportUnavailableError) {
                throw new ServiceUnavailableException();
            }

            throw new InternalServerErrorException({
                message: `Unable to publish a message due an unknown error`
            });
        }
    }
}

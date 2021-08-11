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
    Get,
    Param,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
    ServiceUnavailableException
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UserDecorator } from '../auth/user.decorator';
import { ChannelMetadata } from '@energyweb/dsb-address-book-core';

@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('channel')
@ApiTags('channel')
@ApiBearerAuth('access-token')
export class ChannelController {
    constructor(private readonly channelService: ChannelService) {}
    private readonly logger = new Logger(ChannelController.name);

    @Post()
    @Roles('channelcreation.roles.dsb.apps.energyweb.iam.ewc')
    @ApiBody({ type: CreateChannelDto })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: 'Creates a channel'
    })
    public async create(
        @UserDecorator() user: any,
        @Body() channel: CreateChannelDto
    ): Promise<string> {
        try {
            const id = await this.channelService.create({
                fqcn: channel.fqcn,
                metadata: { ...channel.metadata, createdBy: user.did }
            });
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

    @Get('/:fqcn')
    @ApiOperation({
        description: 'Returns metadata for the requested channel'
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: ChannelMetadata,
        description: 'Metadata for the requested channel'
    })
    public async getChannelMetadata(@Param() param: { fqcn: string }): Promise<ChannelMetadata> {
        try {
            const metadata = await this.channelService.getMetadata(param.fqcn);
            return metadata;
        } catch (error) {
            console.error(error);
        }
    }
}

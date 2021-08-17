import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    HttpStatus,
    Logger,
    Post,
    Get,
    Param,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Channel } from '@energyweb/dsb-transport-core';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Role } from '../auth/role.decorator';
import { DynamicRolesGuard } from '../auth/dynamic.roles.guard';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UserDecorator } from '../auth/user.decorator';
import { channelErrorHandler } from './error.handler';

@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@UseGuards(JwtAuthGuard, DynamicRolesGuard)
@Controller('channel')
@ApiTags('channel')
@ApiBearerAuth('access-token')
export class ChannelController {
    private readonly logger = new Logger(ChannelController.name);

    constructor(private readonly channelService: ChannelService) {}

    @Post()
    @Role('channelCreator') // refers to role type for each org in organizations.ts
    @ApiBody({ type: CreateChannelDto })
    @ApiOperation({
        description: 'Creates a channel'
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: "Created channel's name"
    })
    public async create(
        @UserDecorator() user: any,
        @Body() createDto: CreateChannelDto
    ): Promise<string> {
        try {
            const channelName = await this.channelService.create({
                ...createDto,
                createdBy: user.did,
                createdDateTime: new Date().toISOString()
            });
            return channelName;
        } catch (error) {
            this.logger.error(error.message);
            channelErrorHandler(error);
        }
    }

    @Get('/pubsub')
    @ApiOperation({
        description:
            'Return a list of available channels for the requestor user to publish or subscribe'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: Array,
        description: 'Array of channels with their options'
    })
    public async getAvailableChannels(@UserDecorator() user: any): Promise<Channel[]> {
        try {
            const channels = await this.channelService.getAvailableChannels(
                user.did,
                user.verifiedRoles.map((role: any) => role.namespace)
            );
            return channels;
        } catch (error) {
            this.logger.error(error.message);
            channelErrorHandler(error);
        }
    }

    @Get('/:fqcn')
    @ApiOperation({
        description: "Returns the requested channel's options"
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: Object,
        description: 'Channel options'
    })
    public async getChannel(@Param('fqcn') fqcn: string): Promise<Channel> {
        try {
            const metadata = await this.channelService.getChannel(fqcn);
            return metadata;
        } catch (error) {
            this.logger.error(error.message);
            channelErrorHandler(error);
        }
    }
}

import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    HttpStatus,
    Logger,
    Post,
    Get,
    Patch,
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
import { UpdateChannelDto } from './dto/update-channel.dto';
import { UserDecorator } from '../auth/user.decorator';
import { channelErrorHandler } from './error.handler';
import { ChannelDataPipe } from './channel.data.pipe';

@Controller('channel')
@UseGuards(JwtAuthGuard, DynamicRolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@ApiTags('channel')
@ApiBearerAuth('access-token')
export class ChannelController {
    private readonly logger = new Logger(ChannelController.name);

    constructor(private readonly channelService: ChannelService) {}

    @Post()
    @Role('channelCreator') // refers to role type for each org in configs/organizations.ts
    @ApiBody({ type: CreateChannelDto })
    @ApiOperation({
        description: 'Creates a channel'
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: "Created channel's name"
    })
    public async createChannel(
        @UserDecorator() user: any,
        @Body(ChannelDataPipe) createDto: CreateChannelDto
    ): Promise<string> {
        try {
            const channelName = await this.channelService.createChannel({
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

    @Patch()
    @Role('user')
    @ApiBody({ type: UpdateChannelDto })
    @ApiOperation({
        description: 'Updates a channel'
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        type: String,
        description: 'Update result'
    })
    public async updateChannel(
        @UserDecorator() user: any,
        @Body(ChannelDataPipe) updateDto: UpdateChannelDto
    ): Promise<string> {
        try {
            const result = await this.channelService.updateChannel({
                ...updateDto,
                modifiedBy: user.did,
                modifiedDateTime: new Date().toISOString()
            });
            return result;
        } catch (error) {
            this.logger.error(error.message);
            channelErrorHandler(error);
        }
    }

    @Get('/pubsub')
    @Role('user')
    @ApiOperation({
        description:
            'Returns the list of accessible channels to publish or subscribe based on DID and verified-roles of the user'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: Array,
        description: 'Array of channels with their options'
    })
    public async getAccessibleChannels(@UserDecorator() user: any): Promise<Channel[]> {
        try {
            const channels = await this.channelService.getAccessibleChannels(
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
    @Role('user')
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

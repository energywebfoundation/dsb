import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    HttpStatus,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {
    ApiBody,
    ApiResponse,
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiParam
} from '@nestjs/swagger';

import { Channel } from '@energyweb/dsb-transport-core';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { Role } from '../auth/role.decorator';
import { DynamicRolesGuard } from '../auth/dynamic.roles.guard';
import { UserDecorator } from '../auth/user.decorator';
import { FqcnValidationPipe } from '../utils/fqcn.validation.pipe';

import { ChannelService } from './channel.service';
import { CreateChannelDto, RemoveChannelDto, UpdateChannelDto, ReadChannelDto } from './dto';
import { ChannelDataPipe } from './channel.pipe';
import { ChannelInterceptor } from './channel.interceptor';

@Controller('channel')
@UseGuards(JwtAuthGuard, DynamicRolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
@UseInterceptors(ChannelInterceptor)
@ApiTags('channel')
@ApiBearerAuth('access-token')
export class ChannelController {
    constructor(private readonly channelService: ChannelService) {}

    @Post()
    @Role('channelcreation')
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
        @Body(FqcnValidationPipe, ChannelDataPipe) createDto: CreateChannelDto
    ): Promise<string> {
        const channelName = await this.channelService.createChannel({
            ...createDto,
            maxMsgSize: createDto.maxMsgSize ?? 1048576, //1Mb default
            createdBy: user.did,
            createdDateTime: new Date().toISOString()
        });
        return channelName;
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
        @Body(FqcnValidationPipe, ChannelDataPipe) updateDto: UpdateChannelDto
    ): Promise<string> {
        const result = await this.channelService.updateChannel({
            ...updateDto,
            modifiedBy: user.did,
            modifiedDateTime: new Date().toISOString()
        });
        return result;
    }

    @Get('/pubsub')
    @Role('user')
    @ApiOperation({
        description:
            'Returns the list of accessible channels to publish or subscribe based on DID and verified-roles of the user'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: [Channel],
        description: 'Array of channels with their options'
    })
    public async getAccessibleChannels(@UserDecorator() user: any): Promise<Channel[]> {
        const channels = await this.channelService.getAccessibleChannels(
            user.did,
            user.verifiedRoles.map((role: any) => role.namespace)
        );
        return channels;
    }

    @Get('/:fqcn')
    @Role('user')
    @ApiParam({ name: 'fqcn', type: String })
    @ApiOperation({
        description: "Returns the requested channel's options"
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: Object,
        description: 'Channel options'
    })
    public async getChannel(
        @UserDecorator() user: any,
        @Param(FqcnValidationPipe) { fqcn }: ReadChannelDto
    ): Promise<Channel> {
        const metadata = await this.channelService.getChannel({
            fqcn,
            userDID: user.did,
            userVRs: user.verifiedRoles.map((role: any) => role.namespace)
        });
        return metadata;
    }

    @Delete('/:fqcn')
    @Role('user')
    @ApiParam({ name: 'fqcn', type: String })
    @ApiOperation({
        description: 'Removes the channel'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: String,
        description: 'Channel deletion result'
    })
    public async removeChannel(
        @UserDecorator() user: any,
        @Param(FqcnValidationPipe) { fqcn }: RemoveChannelDto
    ): Promise<string> {
        const result = await this.channelService.remove({ fqcn, userDID: user.did });
        return result;
    }
}

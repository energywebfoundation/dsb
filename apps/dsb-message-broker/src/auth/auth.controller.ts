import {
    ClassSerializerInterceptor,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { LoginDataDTO } from './login-data.dto';
import { LoginReturnDataDTO } from './login-return-data.dto';
import { LoginGuard } from './login.guard';
import { LoginService } from './login.service';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(ValidationPipe)
export class AuthController {
    constructor(private readonly loginService: LoginService) {}

    @UseGuards(LoginGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: LoginDataDTO })
    @ApiResponse({ status: HttpStatus.OK, type: LoginReturnDataDTO, description: 'Log in' })
    async login(@Request() req: ExpressRequest): Promise<LoginReturnDataDTO> {
        const mbIdentifiers = await this.loginService.mbIdentifiers(req.body.identityToken);

        return {
            token: req.user as string,
            ...mbIdentifiers
        };
    }
}

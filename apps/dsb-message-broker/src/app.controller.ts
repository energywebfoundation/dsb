import { Controller, HttpStatus, Get } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('/')
@ApiTags('root')
export class AppController {
    @Get()
    @ApiOperation({
        description: 'Returns 200 response code with "OK"'
    })
    @ApiResponse({
        status: HttpStatus.OK
    })
    public async getAccessibleChannels(): Promise<string> {
        return 'OK';
    }
}

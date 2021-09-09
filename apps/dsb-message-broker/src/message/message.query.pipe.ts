import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MessageQueryPipe implements PipeTransform<any> {
    async transform(data: any) {
        if (data.from) {
            if (!isNaN(data.from) || isNaN(Date.parse(data.from))) {
                throw new BadRequestException(
                    'The value of from parameter is not a valid dateTime.'
                );
            }

            if (data.from) {
                if (data.from.includes('.')) {
                    throw new BadRequestException('from should not contain milliseconds');
                }
            }
        }
        if (data.clientId) {
            if (data.clientId.includes('.')) {
                throw new BadRequestException('clientId should not contain dots');
            }
        }
        return data;
    }
}

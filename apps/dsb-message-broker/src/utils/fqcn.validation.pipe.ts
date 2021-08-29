import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

import { extractFqcn } from '.';

@Injectable()
export class FqcnValidationPipe implements PipeTransform<any> {
    async transform(data: any) {
        const { org, app, channel } = extractFqcn(data.fqcn);
        if (!org || !app || !channel) {
            throw new BadRequestException({
                statusCode: 400,
                message: 'fqcn is not a fully qualified channel name.',
                error: 'Bad Request'
            });
        }
        return data;
    }
}

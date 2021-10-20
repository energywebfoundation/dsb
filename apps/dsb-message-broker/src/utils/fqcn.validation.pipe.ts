import { PipeTransform, Injectable } from '@nestjs/common';

import { extractFqcn } from '.';
import { FqcnNotQualifiedError } from '../channel/error';

@Injectable()
export class FqcnValidationPipe implements PipeTransform<any> {
    async transform(data: any) {
        const { org, app, channel } = extractFqcn(data.fqcn);
        if (!org || !app || !channel) throw new FqcnNotQualifiedError(data.fqcn);
        return data;
    }
}

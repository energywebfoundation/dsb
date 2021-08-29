import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MessageQueryPipe implements PipeTransform<any> {
    async transform(value: string) {
        if (!value) throw new BadRequestException('fqcn is missing in the query!');
        return value;
    }
}

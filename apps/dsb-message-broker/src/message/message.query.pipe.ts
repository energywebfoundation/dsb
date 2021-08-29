import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MessageQueryPipe implements PipeTransform<any> {
    async transform(data: any) {
        if (!data.fqcn) throw new BadRequestException('fqcn is missing in the query!');
        if (typeof data.fqcn !== 'string') throw new BadRequestException('fqcn must be a string!');
        return data;
    }
}

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Channel } from '@energyweb/dsb-transport-core';

import { extractFqcn } from '../utils';
import { TopicSchemaService } from '../utils/topic.schema.service';

@Injectable()
export class ChannelDataPipe implements PipeTransform<any> {
    constructor(
        private readonly configService: ConfigService,
        private readonly topicSchemaService: TopicSchemaService
    ) {}

    async transform(channelData: Channel) {
        const { channel } = extractFqcn(channelData.fqcn);

        const fqcnIsValid = new RegExp('^[a-zA-Z0-9]{1,16}$').test(channel);

        if (!fqcnIsValid) {
            throw new BadRequestException({
                statusCode: 400,
                message: 'fqcn does not match the defined pattern.',
                error: 'Bad Request'
            });
        }

        channelData.topics?.forEach((topic: any, index: number) => {
            let _schema: any = topic.schema;

            if (typeof _schema === 'string') _schema = JSON.parse(_schema);

            if (_schema && _schema.hasOwnProperty('$schema')) delete _schema['$schema'];
            if (_schema && _schema.hasOwnProperty('$id')) delete _schema['$id'];
            if (_schema && _schema.hasOwnProperty('version')) delete _schema['version'];

            const isValid = this.topicSchemaService.validateSchema(_schema);

            if (!isValid) {
                throw new BadRequestException({
                    statusCode: 400,
                    message: `topics.${index}.schema is not valid`,
                    error: 'Bad Request'
                });
            }

            if (typeof topic.schema !== 'string') topic.schema = JSON.stringify(_schema);
        });

        return channelData;
    }
}

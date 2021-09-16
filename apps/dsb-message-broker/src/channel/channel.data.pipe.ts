import { PipeTransform, Injectable, BadRequestException, Logger } from '@nestjs/common';

import { Channel } from '@energyweb/dsb-transport-core';

import { extractFqcn } from '../utils';
import { TopicSchemaService } from '../utils/topic.schema.service';

@Injectable()
export class ChannelDataPipe implements PipeTransform<any> {
    private readonly logger = new Logger(ChannelDataPipe.name);

    constructor(private readonly topicSchemaService: TopicSchemaService) {}

    async transform(channelData: Channel) {
        /* validation of first part of fqcn */
        const { channel } = extractFqcn(channelData.fqcn);

        const fqcnIsValid = new RegExp('^[a-zA-Z0-9]{1,16}$').test(channel);

        if (!fqcnIsValid) {
            throw new BadRequestException({
                statusCode: 400,
                message:
                    'First part of the fqcn does not match the defined pattern(^[a-zA-Z0-9]{1,16}$).',
                error: 'Bad Request'
            });
        }

        /* validation of each topic schema */
        if (channelData.topics) this.topicSchemaService.removeValidators(channelData.fqcn);
        channelData.topics?.forEach((topic: any, index: number) => {
            try {
                if (topic.schemaType !== 'XSD') {
                    if (typeof topic.schema === 'string') {
                        topic.schema = JSON.parse(topic.schema);
                    }
                    if (topic.schema && topic.schema.hasOwnProperty('$schema')) {
                        delete topic.schema['$schema'];
                    }
                    if (topic.schema && topic.schema.hasOwnProperty('$id')) {
                        delete topic.schema['$id'];
                    }
                    if (topic.schema && topic.schema.hasOwnProperty('version')) {
                        delete topic.schema['version'];
                    }
                }

                this.topicSchemaService.validateSchema(
                    channelData.fqcn,
                    topic.namespace,
                    topic.schemaType,
                    topic.schema
                );
            } catch (error) {
                this.logger.error(error.message);
                throw new BadRequestException({
                    statusCode: 400,
                    message: [`topics.${index}.schema is not valid`, error.message],
                    error: 'Bad Request'
                });
            }
        });

        return channelData;
    }
}

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
        if (channelData.topics) {
            this.topicSchemaService.removeValidators(channelData.fqcn);

            for await (const [index, topic] of channelData.topics.entries()) {
                try {
                    let _schema = topic.schema as any;
                    if (topic.schemaType !== 'XSD') {
                        if (typeof _schema === 'string') {
                            _schema = JSON.parse(_schema);
                        }
                        if (_schema && _schema.hasOwnProperty('$schema')) {
                            delete _schema['$schema'];
                        }
                        if (_schema && _schema.hasOwnProperty('$id')) {
                            delete _schema['$id'];
                        }
                        if (_schema && _schema.hasOwnProperty('version')) {
                            delete _schema['version'];
                        }
                    }
                    topic.schema = _schema;

                    await this.topicSchemaService.validateSchema(
                        channelData.fqcn,
                        topic.namespace,
                        topic.schemaType,
                        topic.schema
                    );
                } catch (error) {
                    this.logger.error(error.message);

                    let errMsg = error.message;
                    if (error instanceof SyntaxError) errMsg = [errMsg];
                    else errMsg = JSON.parse(errMsg);

                    throw new BadRequestException({
                        statusCode: 400,
                        message: [`topics.${index}.schema is not valid`, ...errMsg],
                        error: 'Bad Request'
                    });
                }
            }
        }

        return channelData;
    }
}

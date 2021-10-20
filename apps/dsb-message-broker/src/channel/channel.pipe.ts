import { PipeTransform, Injectable } from '@nestjs/common';

import { Channel } from '@energyweb/dsb-transport-core';

import { extractFqcn } from '../utils';
import { TopicSchemaService } from '../utils/topic.schema.service';
import { FqcnNotMatchedError, TopicSchemaNotValidError } from './error';

@Injectable()
export class ChannelDataPipe implements PipeTransform<any> {
    constructor(private readonly topicSchemaService: TopicSchemaService) {}

    async transform(channelData: Channel) {
        /* validation of first part of fqcn */
        const { channel } = extractFqcn(channelData.fqcn);
        const fqcnIsValid = new RegExp('^[a-zA-Z0-9]{1,16}$').test(channel);
        if (!fqcnIsValid) throw new FqcnNotMatchedError(channelData.fqcn);

        /* validation of each topic schema */
        if (channelData.topics) {
            this.topicSchemaService.removeValidators(channelData.fqcn);

            for await (const [index, topic] of channelData.topics.entries()) {
                if (topic.schemaType !== 'XSD') {
                    let _schema = topic.schema as any;

                    if (typeof _schema === 'string') {
                        try {
                            _schema = JSON.parse(_schema);
                        } catch (error) {
                            throw new TopicSchemaNotValidError(
                                topic.namespace ?? index.toString(),
                                error.message
                            );
                        }
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

                    topic.schema = _schema;
                }

                await this.topicSchemaService.validateSchema(
                    channelData.fqcn,
                    topic.namespace,
                    topic.schemaType,
                    topic.schema
                );
            }
        }

        return channelData;
    }
}

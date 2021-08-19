import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extractFqcn } from '../utils';
import { TopicSchemaService } from '../utils/topic.schema.service';
import { Channel } from '@energyweb/dsb-transport-core';

@Injectable()
export class ChannelDataPipe implements PipeTransform<any> {
    constructor(
        private readonly configService: ConfigService,
        private readonly topicSchemaService: TopicSchemaService
    ) {}

    async transform(channelData: Channel) {
        const { org, app, channel } = extractFqcn(channelData.fqcn);
        if (!org || !app || !channel)
            throw new BadRequestException('fqcn is not a fully qualified channel name.');

        const organizations = this.configService.get('ORGANIZATIONS');

        const fqcnIsValid = organizations.some((_org: any) => {
            if (_org.name !== org) return false;
            return _org.apps.some((_app: any) => {
                if (_app.name !== app) return false;

                return new RegExp(_app.channels).test(channel);
            });
        });
        if (!fqcnIsValid) throw new BadRequestException('fqcn does not match the defined pattern.');

        channelData.topics?.forEach((topic: any) => {
            let _schema: any = topic.schema;

            if (typeof _schema === 'string') _schema = JSON.parse(_schema);

            const isValid = this.topicSchemaService.validateSchema(_schema);

            if (!isValid)
                throw new BadRequestException(`Topic schema in ${topic.namespace} is not valid.`);

            if (typeof topic.schema !== 'string') topic.schema = JSON.stringify(_schema);
        });

        return channelData;
    }
}

import { ITransport } from '@energyweb/dsb-transport-core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Ajv, { JSONSchemaType, AnySchema } from 'ajv';

@Injectable()
export class TopicSchemaService implements OnModuleInit {
    private transport: ITransport;
    private readonly ajv = new Ajv();
    private readonly _validates = new Map<string, any>();

    constructor(private readonly moduleRef: ModuleRef) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public validate(fqcn: string, topic: string, payload: string): boolean {
        let _validate = this._validates.get(fqcn + '/' + topic);
        if (!_validate) {
            const channel = this.transport.getChannel(fqcn);
            const schema = channel.topics?.find(
                (_topic: any) => _topic.namespace === topic
            )?.schema;
            if (schema) {
                const JSONSchema: JSONSchemaType<any> = JSON.parse(schema);
                _validate = this.ajv.compile(JSONSchema);
                this._validates.set(fqcn + '/' + topic, _validate);
            }
        }
        if (_validate) {
            const valid = _validate(JSON.parse(payload));
            return valid;
        }
        return true;
    }

    public removeValidator(fqcn: string, topic: string): void {
        this._validates.delete(fqcn + '/' + topic);
    }

    public validateSchema(schema: AnySchema): boolean {
        // needs a solid schema to validate
        return this.ajv.validateSchema(schema) as boolean;
    }
}

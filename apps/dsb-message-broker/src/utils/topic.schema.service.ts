import { ITransport } from '@energyweb/dsb-transport-core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Ajv, { JSONSchemaType, AnySchema, ValidateFunction } from 'ajv';

@Injectable()
export class TopicSchemaService implements OnModuleInit {
    private transport: ITransport;
    private readonly ajv = new Ajv();
    private readonly _validators = new Map<string, Record<string, ValidateFunction<unknown>>>();

    constructor(private readonly moduleRef: ModuleRef) {}

    public async onModuleInit(): Promise<void> {
        this.transport = this.moduleRef.get<ITransport>(ITransport, {
            strict: false
        });
    }

    public validate(fqcn: string, topic: string, payload: string): boolean {
        let validators = this._validators.get(fqcn);
        if (!validators) validators = {};

        if (!validators[topic]) {
            const channel = this.transport.getChannel(fqcn);

            const schema = channel?.topics?.find(
                (_topic: any) => _topic.namespace === topic
            )?.schema;

            if (schema) {
                const JSONSchema: JSONSchemaType<any> = JSON.parse(schema);
                validators[topic] = this.ajv.compile(JSONSchema);
                this._validators.set(fqcn, validators);
            }
        }

        if (validators[topic]) {
            const _validate = validators[topic];
            const isValid = _validate(JSON.parse(payload));
            return isValid;
        }

        return true;
    }

    public removeValidator(fqcn: string, topic: string): void {
        const validators = this._validators.get(fqcn);
        if (!validators) return;
        if (validators[topic]) {
            delete validators[topic];
            this._validators.set(fqcn, validators);
        }
    }
    public removeValidators(fqcn: string): void {
        this._validators.delete(fqcn);
    }

    public validateSchema(schema: AnySchema): boolean {
        // needs a better schema validation logic
        return this.ajv.validateSchema(schema) as boolean;
    }
}

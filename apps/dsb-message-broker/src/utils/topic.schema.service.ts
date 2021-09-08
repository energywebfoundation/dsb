import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Ajv, { JSONSchemaType, AnySchema, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { json } from 'body-parser';

import { AddressBookService } from '../addressbook/addressbook.service';

@Injectable()
export class TopicSchemaService {
    private readonly ajv = new Ajv({
        multipleOfPrecision: 1000000000
    });
    private readonly _validators = new Map<string, Record<string, ValidateFunction<unknown>>>();

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly addressbook: AddressBookService
    ) {
        addFormats(this.ajv, { mode: 'fast', formats: ['date', 'time'], keywords: true });
    }

    public validate(
        fqcn: string,
        topic: string,
        payload: string
    ): { isValid: boolean; error: any } {
        let validators = this._validators.get(fqcn);
        if (!validators) validators = {};

        if (!validators[topic]) {
            const channel = this.addressbook.getChannel(fqcn);

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
            return { isValid, error: JSON.stringify(_validate.errors) };
        }

        return { isValid: true, error: null };
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

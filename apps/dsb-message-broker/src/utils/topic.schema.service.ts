import { BadRequestException, Injectable } from '@nestjs/common';
import Ajv, { JSONSchemaType, AnySchema, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import { AddressBookService } from '../addressbook/addressbook.service';

class JSONValidator {
    constructor(public readonly validate: ValidateFunction<unknown>) {}
}
class XMLValidator {
    constructor(public readonly validate: any) {}
}
@Injectable()
export class TopicSchemaService {
    private readonly ajv = new Ajv({
        multipleOfPrecision: 1000000000
    });
    private readonly _validators = new Map<string, Record<string, JSONValidator | XMLValidator>>();

    constructor(private readonly addressbook: AddressBookService) {
        addFormats(this.ajv, { mode: 'fast', formats: ['date', 'time'], keywords: true });
    }

    public validateSchema(
        fqcn: string,
        topic: string,
        schemaType: string,
        schema: AnySchema
    ): void {
        const { error } = this.setValidator(fqcn, topic, schemaType, schema);
        if (error) throw error;
        return;
    }
    public validate(
        fqcn: string,
        topic: string,
        payload: string
    ): { isValid: boolean; error: any } {
        const validator = this.getValidator(fqcn, topic);
        if (!validator) return { isValid: true, error: null };

        try {
            payload = JSON.parse(payload);
        } catch (error) {
            throw new BadRequestException(['Payload is not in JSON format', error.message]);
        }

        const isValid = validator.validate(payload);
        return { isValid, error: JSON.stringify(validator.validate.errors) };
    }

    private setValidator(
        fqcn: string,
        topic: string,
        schemaType: string,
        schema: JSONSchemaType<any> | any
    ): { validator: any; error: any } {
        let validators = this._validators.get(fqcn);
        if (!validators) validators = {};

        if (schemaType === 'XSD') {
            // const validate = '';
            // validators[topic] = new XMLValidator(validate);
        } else {
            try {
                const validate = this.ajv.compile(schema);
                validators[topic] = new JSONValidator(validate);
            } catch (error) {
                return { validator: null, error };
            }
        }

        this._validators.set(fqcn, validators);
        return { validator: validators[topic], error: null };
    }
    private getValidator(fqcn: string, topic: string) {
        let validators = this._validators.get(fqcn);
        if (!validators) validators = {};

        if (!validators[topic]) {
            const channel = this.addressbook.getChannel(fqcn);

            const _topic = channel?.topics?.find((_topic: any) => _topic.namespace === topic);

            if (_topic && _topic.schema) {
                const { validator } = this.setValidator(
                    fqcn,
                    topic,
                    _topic.schemaType,
                    _topic.schema
                );
                return validator;
            }
        }

        return validators[topic];
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
}

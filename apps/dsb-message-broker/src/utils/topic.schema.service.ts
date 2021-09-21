import path from 'path';
import fs from 'fs';
import { BadRequestException, Injectable } from '@nestjs/common';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import Libxml from 'node-libxml';

import { AddressBookService } from '../addressbook/addressbook.service';

const libxml = new Libxml();

class JSONValidator {
    constructor(public readonly validate: ValidateFunction<unknown>) {}
}
class XMLValidator {
    constructor(public readonly schema: string, public readonly pathToSchema: string) {}
}

@Injectable()
export class TopicSchemaService {
    private readonly ajv = new Ajv({
        multipleOfPrecision: 1000000000
    });
    private readonly _validators = new Map<string, Record<string, JSONValidator | XMLValidator>>();

    constructor(private readonly addressbook: AddressBookService) {
        addFormats(this.ajv, { mode: 'fast', formats: ['date', 'time'], keywords: true });

        const xsdDirectory = path.resolve(__dirname, `../../../xsd_files`);
        if (!fs.existsSync(xsdDirectory)) {
            fs.mkdirSync(xsdDirectory);
        }
    }

    public async validateSchema(
        fqcn: string,
        topic: string,
        schemaType: string,
        schema: any
    ): Promise<void> {
        const { error } = await this.setValidator(fqcn, topic, schemaType, schema);
        if (error) throw new Error(error);
        return;
    }
    public async validate(
        fqcn: string,
        topic: string,
        payload: string
    ): Promise<{ isValid: boolean; error: any }> {
        const validator = await this.getValidator(fqcn, topic);
        if (!validator) return { isValid: true, error: null };
        let isValid, error;

        if (validator instanceof XMLValidator) {
            const isWellformed = libxml.loadXmlFromString(payload);
            libxml.loadSchemas([validator.pathToSchema]);
            isValid = libxml.validateAgainstSchemas();

            if (!isWellformed) {
                error = JSON.stringify(libxml.wellformedErrors);
            } else if (!isValid && libxml.validationSchemaErrors) {
                error = JSON.stringify(Object.values(libxml.validationSchemaErrors)[0]);
            }
        } else {
            try {
                payload = JSON.parse(payload);
            } catch (error) {
                throw new BadRequestException(['Payload is not in JSON format', error.message]);
            }

            isValid = validator.validate(payload);
            error = JSON.stringify(validator.validate.errors);
        }

        return { isValid, error };
    }

    private async setValidator(
        fqcn: string,
        topic: string,
        schemaType: string,
        schema: JSONSchemaType<any> | any
    ): Promise<{ validator: any; error: any }> {
        let validators = this._validators.get(fqcn);
        if (!validators) validators = {};
        let validator, error;

        if (schemaType === 'XSD') {
            const isWellformed = libxml.loadXmlFromString(schema);

            const pathToFile = await this.saveSchemaToFile(`${topic}.${fqcn}.xsd`, schema);

            if (isWellformed) validator = new XMLValidator(schema, pathToFile);
            else error = JSON.stringify(libxml.wellformedErrors);
        } else {
            try {
                const validate = this.ajv.compile(schema);
                validator = new JSONValidator(validate);
            } catch (err) {
                error = JSON.stringify([err.message]);
            }
        }

        validators[topic] = validator;
        this._validators.set(fqcn, validators);

        return { validator, error };
    }
    private async getValidator(fqcn: string, topic: string) {
        const validators = this._validators.get(fqcn);
        if (validators && validators[topic]) return validators[topic];

        const channel = this.addressbook.getChannel(fqcn);
        const _topic = channel?.topics?.find((_topic: any) => _topic.namespace === topic);
        if (!_topic || !_topic.schema) return null;

        const { validator } = await this.setValidator(
            fqcn,
            topic,
            _topic.schemaType,
            _topic.schema
        );
        return validator;
    }

    private saveSchemaToFile(fileName: string, schema: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const pathStr = path.resolve(__dirname, `../../../xsd_files/${fileName}`);

            fs.writeFile(pathStr, schema, 'utf-8', (err) => {
                if (err) reject(err);
                resolve(pathStr);
            });
        });
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

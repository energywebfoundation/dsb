export class FqcnNotQualifiedError extends Error {
    constructor() {
        super('fqcn is not a fully qualified channel name.');
    }
}

export class FqcnNotMatchedError extends Error {
    constructor() {
        super('fqcn does not match the defined pattern.');
    }
}

export class TopicSchemaNotValid extends Error {
    constructor(index: number) {
        super(`topics.${index}.schema is not valid`);
    }
}

export class UnauthorizedToModifyError extends Error {
    constructor(fqcn: string) {
        super(`Unauthorized to modify the channel (${fqcn}).`);
    }
}

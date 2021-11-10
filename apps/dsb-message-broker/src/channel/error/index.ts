export { ChannelNotFoundError } from '@energyweb/dsb-transport-core';

export class FqcnNotQualifiedError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['fqcn is not a fully qualified channel name', fqcn]));
    }
}

export class FqcnNotMatchedError extends Error {
    constructor(fqcn: string) {
        super(
            JSON.stringify([
                'first part of the fqcn does not match the defined pattern (^[a-zA-Z0-9]{1,16}$)',
                fqcn
            ])
        );
    }
}

export class TopicSchemaNotValidError extends Error {
    constructor(topic: string, message: any) {
        super(JSON.stringify(['topic schema is not valid', topic, message]));
    }
}

export class UnauthorizedToGetError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['unauthorized to get the channel', fqcn]));
    }
}

export class UnauthorizedToModifyError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['unauthorized to modify the channel', fqcn]));
    }
}

export class UnauthorizedToRemoveError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['unauthorized to remove the channel', fqcn]));
    }
}

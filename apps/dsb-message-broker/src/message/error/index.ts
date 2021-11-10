export class UnauthorizedToPublishError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['unauthorized to publish to the channel', fqcn]));
    }
}

export class UnauthorizedToSubscribeError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['unauthorized to subscribe to the channel', fqcn]));
    }
}

export class PayloadNotValidJsonError extends Error {
    constructor(topic: string, message: any) {
        super(JSON.stringify(['payload is not a valid stringified json', topic, message]));
    }
}

export class PayloadNotValidXmlError extends Error {
    constructor(topic: string, message: any) {
        super(JSON.stringify(['payload is not a valid stringified xml', topic, message]));
    }
}

export class PayloadNotValidError extends Error {
    constructor(topic: string, message: any) {
        super(JSON.stringify(['payload does not match the schema for the topic', topic, message]));
    }
}

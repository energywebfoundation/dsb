export class UnauthorizedToPublishError extends Error {
    constructor(fqcn: string) {
        super(`Unauthorized to publish to the channel (${fqcn}).`);
    }
}

export class UnauthorizedToSubscribeError extends Error {
    constructor(fqcn: string) {
        super(`Unauthorized to subscribe to the channel (${fqcn}).`);
    }
}

export class PayloadNotValidError extends Error {
    constructor(topic: string) {
        super(`Payload does not match the schema for the topic (${topic ?? 'default'}).`);
    }
}

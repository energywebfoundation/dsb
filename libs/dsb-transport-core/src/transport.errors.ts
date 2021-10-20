export class ChannelNotFoundError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['channel does not exist', fqcn]));
    }
}
export class ChannelOrTopicNotFoundError extends Error {
    constructor(fqcn: string, topic: string) {
        super(JSON.stringify(['channel or topic does not exist', fqcn, topic]));
    }
}
export class ChannelAlreadyCreatedError extends Error {
    constructor(fqcn: string) {
        super(JSON.stringify(['channel already exists', fqcn]));
    }
}
export class TransportUnavailableError extends Error {
    constructor() {
        super(`Transport unavailable!`);
    }
}

export class MessageExceedsMaximumSizeError extends Error {
    constructor() {
        super(`Incoming message exceeds maximum allowed size`);
    }
}

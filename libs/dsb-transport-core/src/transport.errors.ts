export class ChannelNotFoundError extends Error {
    constructor(fqcn: string) {
        super(`Channel ${fqcn} does not exist.`);
    }
}
export class ChannelOrTopicNotFoundError extends Error {
    constructor(fqcn: string, topic: string) {
        super(`Channel (${fqcn}) or topic (${topic}) does not exist.`);
    }
}
export class ChannelAlreadyCreatedError extends Error {
    constructor(fqcn: string) {
        super(`Channel (${fqcn}) already exists.`);
    }
}
export class TransportUnavailableError extends Error {
    constructor() {
        super(`Transport unavailable!`);
    }
}

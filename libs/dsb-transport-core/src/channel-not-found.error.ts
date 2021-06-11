export class ChannelNotFoundError extends Error {
    constructor(fqcn: string) {
        super(`Channel ${fqcn} does not exist`);
    }
}

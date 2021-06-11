export class ChannelAlreadyCreatedError extends Error {
    constructor(fqcn: string) {
        super(`Channel ${fqcn} already exists`);
    }
}

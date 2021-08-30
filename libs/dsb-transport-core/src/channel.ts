export class Channel {
    constructor(
        public readonly fqcn: string,
        public readonly topics?: {
            namespace: string;
            schema: string;
        }[],
        public readonly admins?: string[],
        public readonly publishers?: string[],
        public readonly subscribers?: string[],
        public readonly maxMsgAge?: number,
        public readonly maxMsgSize?: number,
        public readonly createdBy?: string,
        public readonly createdDateTime?: string
    ) {}
}

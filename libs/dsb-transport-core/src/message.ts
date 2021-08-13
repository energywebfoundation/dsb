export class Message {
    constructor(
        public readonly id: string,
        public readonly data: string,
        public readonly timestampNanos: number
    ) {}
}

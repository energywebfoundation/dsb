import {
    ChannelAlreadyCreatedError,
    ChannelNotFoundError,
    ITransport,
    Message,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';
import { Logger } from '@nestjs/common';
import { AckPolicy, connect, NatsConnection, StringCodec } from 'nats';
import polly from 'polly-js';

import { fqcnToStream } from './fqcn-utils';

export class NATSJetstreamTransport implements ITransport {
    private stringCodec = StringCodec();
    private readonly logger = new Logger(NATSJetstreamTransport.name);
    private connection: NatsConnection;

    private isTransportConnected = false;

    constructor(private readonly servers: string[]) {}

    public async isConnected(): Promise<boolean> {
        return this.isTransportConnected;
    }

    public async connect() {
        try {
            await polly()
                .waitAndRetry(5)
                .executeForPromise(async (info: polly.Info) => {
                    this.logger.log(`Connecting to ${this.servers} ${info.count}/5`);
                    this.connection = await connect({ servers: this.servers });

                    this.isTransportConnected = true;
                    this.logger.log(`Successfully connected to ${this.servers}`);

                    this.startConnectionMonitor();
                });
        } catch (error) {
            this.logger.error(`Unable to connect to ${this.servers}. Error: ${error}`);

            throw new Error('Unable to connect to the transport layer');
        }
    }

    public async publish(fqcn: string, payload: string): Promise<string> {
        await this.ensureConnected();

        const jetstream = this.connection.jetstream();

        try {
            const { subject } = fqcnToStream(fqcn);
            const publishAck = await jetstream.publish(subject, this.stringCodec.encode(payload));

            return publishAck.seq.toString();
        } catch (error) {
            this.logger.error(error);
            throw new ChannelNotFoundError(fqcn);
        }
    }

    public async createChannel(fqcn: string): Promise<string> {
        await this.ensureConnected();

        const jetstreamManager = await this.connection.jetstreamManager();

        const { stream, subject } = fqcnToStream(fqcn);

        try {
            await jetstreamManager.streams.add({
                name: stream,
                subjects: [subject]
            });
        } catch (error) {
            this.logger.error(error);
            throw new ChannelAlreadyCreatedError(fqcn);
        }

        return stream;
    }

    public async removeChannel(fqcn: string): Promise<string> {
        await this.ensureConnected();

        const jetstreamManager = await this.connection.jetstreamManager();

        const { stream } = fqcnToStream(fqcn);

        try {
            await jetstreamManager.streams.delete(stream);
        } catch (error) {
            this.logger.error(error);
            throw new ChannelNotFoundError(fqcn);
        }

        return stream;
    }

    public async pull(fqcn: string, clientId: string, amount: number): Promise<Message[]> {
        await this.ensureConnected();

        const jetstreamManager = await this.connection.jetstreamManager();
        const { stream } = fqcnToStream(fqcn);

        let consumer;
        try {
            consumer = await jetstreamManager.consumers.info(stream, clientId);
        } catch (error) {
            this.logger.log(error);
        }

        if (!consumer) {
            try {
                this.logger.log(
                    `Consumer with clientId ${clientId} does not exist. Attempting to create it.`
                );

                await jetstreamManager.consumers.add(stream, {
                    name: clientId,
                    durable_name: clientId,
                    ack_policy: AckPolicy.Explicit
                });
            } catch (error) {
                this.logger.log(error);
                if (error.toString().includes('stream not found')) {
                    throw new ChannelNotFoundError(fqcn);
                }
            }
        }

        const jetstream = this.connection.jetstream();
        const res: Message[] = [];

        const messageIterator = jetstream.fetch(stream, clientId, { batch: amount, no_wait: true });
        for await (const message of messageIterator) {
            message.ack();
            res.push(new Message(message.seq.toString(), this.stringCodec.decode(message.data)));
        }

        return res;
    }

    private async ensureConnected() {
        if (!this.isTransportConnected) {
            this.logger.error('Transport layer not reachable');
            throw new TransportUnavailableError();
        }
    }

    private async startConnectionMonitor() {
        for await (const s of this.connection.status()) {
            switch (s.type) {
                case 'disconnect':
                    this.logger.error(`Connection to ${s.data} has been lost`);
                    this.isTransportConnected = false;
                    break;
                case 'reconnecting':
                    this.logger.log(`Reconnecting to ${s.data}`);
                    break;
                case 'reconnect':
                    this.logger.log(`Connection to ${s.data} restored`);
                    this.isTransportConnected = true;
                    break;
            }
        }
    }
}

import {
    ChannelAlreadyCreatedError,
    ChannelNotFoundError,
    ITransport,
    Message,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';
import { NatsJetstreamAddressBook, ChannelMetadata } from '@energyweb/dsb-address-book-nats-js';
import { Logger } from '@nestjs/common';
import {
    AckPolicy,
    connect,
    NatsConnection,
    StringCodec,
    ConsumerInfo,
    JetStreamManager,
    JetStreamClient,
    consumerOpts,
    createInbox
} from 'nats';
import polly from 'polly-js';

import { fqcnToStream } from './fqcn-utils';

export class NATSJetstreamTransport implements ITransport {
    private stringCodec = StringCodec();
    private readonly logger = new Logger(NATSJetstreamTransport.name);
    private connection: NatsConnection;
    private jetstreamManager: JetStreamManager;
    private jetstreamClient: JetStreamClient;

    private isTransportConnected = false;

    private addressBook: NatsJetstreamAddressBook;

    constructor(
        private readonly servers: string[],
        web3Url: string,
        privateKey: string,
        mbDID: string
    ) {
        this.addressBook = new NatsJetstreamAddressBook(this, web3Url, privateKey, mbDID);
    }

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
                    this.jetstreamManager = await this.connection.jetstreamManager();
                    this.jetstreamClient = this.connection.jetstream();
                    this.isTransportConnected = true;
                    this.logger.log(`Successfully connected to ${this.servers}`);

                    await this.addressBook.init();
                    this.logger.log('AddressBook is initialized!');

                    this.startConnectionMonitor();
                });
        } catch (error) {
            this.logger.error(`Unable to connect to ${this.servers}. Error: ${error}`);

            throw new Error('Unable to connect to the transport layer');
        }
    }

    public async publish(fqcn: string, payload: string): Promise<string> {
        await this.ensureConnected();
        try {
            const { subject } = fqcnToStream(fqcn);
            const publishAck = await this.jetstreamClient.publish(
                subject,
                this.stringCodec.encode(payload)
            );

            return publishAck.seq.toString();
        } catch (error) {
            this.logger.error(error);
            throw new ChannelNotFoundError(fqcn);
        }
    }

    public async createChannel(fqcn: string, metadata?: ChannelMetadata): Promise<string> {
        await this.ensureConnected();

        const { stream, subject } = fqcnToStream(fqcn);

        try {
            await this.jetstreamManager.streams.add({
                name: stream,
                subjects: [subject]
            });
            if (metadata) await this.addressBook.register(fqcn, metadata);
        } catch (error) {
            this.logger.error(error);
            throw new ChannelAlreadyCreatedError(fqcn);
        }

        return stream;
    }

    public async removeChannel(fqcn: string): Promise<string> {
        await this.ensureConnected();

        const { stream } = fqcnToStream(fqcn);

        try {
            await this.jetstreamManager.streams.delete(stream);
        } catch (error) {
            this.logger.error(error);
            throw new ChannelNotFoundError(fqcn);
        }

        return stream;
    }

    public async hasChannel(fqcn: string): Promise<boolean> {
        await this.ensureConnected();
        const { stream } = fqcnToStream(fqcn);
        const streams = await this.jetstreamManager.streams.list().next();
        return streams.some((_streamInfo) => _streamInfo.config.name === stream);
    }

    public async getChannelMetadata(fqcn: string): Promise<ChannelMetadata> {
        return this.addressBook.findByFqcn(fqcn);
    }

    public async pull(fqcn: string, clientId: string, amount: number): Promise<Message[]> {
        const consumerIsAvailable = await this.hasConsumer(fqcn, clientId);
        if (!consumerIsAvailable) {
            try {
                this.logger.log(
                    `Consumer with clientId ${clientId} does not exist. Attempting to create it.`
                );

                await this.createConsumer(fqcn, clientId);
            } catch (error) {
                this.logger.log(error);
                if (error.toString().includes('stream not found')) {
                    throw new ChannelNotFoundError(fqcn);
                }
            }
        }

        const { stream } = fqcnToStream(fqcn);
        const res: Message[] = [];

        const messageIterator = this.jetstreamClient.fetch(stream, clientId, {
            batch: amount,
            no_wait: true
        });
        for await (const message of messageIterator) {
            message.ack();
            res.push(
                new Message(
                    message.seq.toString(),
                    this.stringCodec.decode(message.data),
                    message.info.timestampNanos
                )
            );
        }

        return res;
    }

    public async subscribe(fqcn: string, clientId: string, cb: any): Promise<void> {
        const { subject } = fqcnToStream(fqcn);

        const opts = consumerOpts();
        opts.durable(clientId);
        opts.manualAck();
        opts.ackExplicit();
        opts.deliverTo(createInbox());

        const messageIterator = await this.jetstreamClient.subscribe(subject, opts);
        for await (const message of messageIterator) {
            message.ack();
            cb(
                new Message(
                    message.seq.toString(),
                    this.stringCodec.decode(message.data),
                    message.info.timestampNanos
                )
            );
        }
    }

    public async createConsumer(fqcn: string, clientId: string): Promise<ConsumerInfo> {
        await this.ensureConnected();
        const { stream } = fqcnToStream(fqcn);

        return this.jetstreamManager.consumers.add(stream, {
            name: clientId,
            durable_name: clientId,
            ack_policy: AckPolicy.Explicit
        });
    }

    public async removeConsumer(fqcn: string, clientId: string): Promise<boolean> {
        await this.ensureConnected();
        const { stream } = fqcnToStream(fqcn);

        return this.jetstreamManager.consumers.delete(stream, clientId);
    }

    public async hasConsumer(fqcn: string, consumer: string): Promise<boolean> {
        await this.ensureConnected();
        const { stream } = fqcnToStream(fqcn);

        const consumers = await this.jetstreamManager.consumers.list(stream).next();
        return consumers.some((consumerInfo) => consumerInfo.name === consumer);
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

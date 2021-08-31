import { Logger } from '@nestjs/common';

import {
    ChannelAlreadyCreatedError,
    ChannelNotFoundError,
    ChannelOrTopicNotFoundError,
    ITransport,
    Message,
    Channel,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';

import {
    AckPolicy,
    connect,
    NatsConnection,
    StringCodec,
    ConsumerInfo,
    JetStreamManager,
    JetStreamSubscription,
    JetStreamClient,
    consumerOpts,
    createInbox,
    StreamConfig,
    NatsError,
    JsMsg
} from 'nats';
import polly from 'polly-js';

import { fqcnToStream, getStreamName, getStreamSubjects, getSubjectName } from './fqcn-utils';

export class NATSJetstreamTransport implements ITransport {
    private stringCodec = StringCodec();
    private readonly logger = new Logger(NATSJetstreamTransport.name);
    private connection: NatsConnection;
    private jetstreamManager: JetStreamManager;
    private jetstreamClient: JetStreamClient;

    private isTransportConnected = false;

    private subcriptions = new Map<number, JetStreamSubscription>();

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
                    this.jetstreamManager = await this.connection.jetstreamManager();
                    this.jetstreamClient = this.connection.jetstream();
                    this.isTransportConnected = true;
                    this.logger.log(`Successfully connected to ${this.servers}`);

                    this.startConnectionMonitor();
                });
        } catch (error) {
            this.logger.error(`Unable to connect to ${this.servers}. Error: ${error}`);

            throw new Error('Unable to connect to the transport layer');
        }
    }

    public async createChannel(channel: Channel): Promise<string> {
        await this.ensureConnected();

        try {
            const stream = getStreamName(channel.fqcn);
            const subjects = getStreamSubjects(stream, channel.topics);

            const otherOptions: Partial<StreamConfig> = {};
            if (channel.maxMsgAge) otherOptions['max_age'] = channel.maxMsgAge;
            if (channel.maxMsgSize) otherOptions['max_msg_size'] = channel.maxMsgSize;

            await this.jetstreamManager.streams.add({
                name: stream,
                subjects,
                ...otherOptions
            });

            return stream;
        } catch (error) {
            this.logger.error(error);
            throw new ChannelAlreadyCreatedError(channel.fqcn);
        }
    }

    public async updateChannel(channel: Channel): Promise<string> {
        const stream = getStreamName(channel.fqcn);
        const subjects = getStreamSubjects(stream, channel.topics);

        const updateObject: Partial<StreamConfig> = {};
        updateObject.subjects = subjects;
        if (channel.maxMsgAge) updateObject['max_age'] = channel.maxMsgAge;
        if (channel.maxMsgSize) updateObject['max_msg_size'] = channel.maxMsgSize;

        const _channel = (await this.jetstreamManager.streams.info(stream)).config;

        await this.jetstreamManager.streams.update({
            ...{ ..._channel, ...updateObject }
        });

        return 'ok';
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
        const stream = getStreamName(fqcn);
        const streams = await this.jetstreamManager.streams.list().next();
        return streams.some((_streamInfo) => _streamInfo.config.name === stream);
    }

    public async publish(fqcn: string, topic = 'default', payload: string): Promise<string> {
        await this.ensureConnected();
        try {
            const subject = getSubjectName(fqcn, topic);
            const publishAck = await this.jetstreamClient.publish(
                subject,
                this.stringCodec.encode(payload)
            );

            return publishAck.seq.toString();
        } catch (error) {
            this.logger.error(error);
            throw new ChannelOrTopicNotFoundError(fqcn, topic);
        }
    }

    public async pull(fqcn: string, amount: number, clientId: string): Promise<Message[]> {
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
                    message.subject.split('.').pop(),
                    this.stringCodec.decode(message.data),
                    message.info.timestampNanos
                )
            );
        }

        return res;
    }

    public async subscribe(
        fqcn: string,
        topic: string,
        clientId: string,
        cb: any,
        socketId?: string
    ): Promise<number> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;
        const _subject = getSubjectName(fqcn, topic);

        const opts = consumerOpts();
        opts.durable(clientId);
        opts.manualAck();
        opts.ackExplicit();
        opts.deliverTo(createInbox());
        opts.callback(function (err: NatsError | null, msg: JsMsg | null) {
            if (err) return cb(err);
            msg.ack();
            const cbBody = [];
            if (socketId) cbBody.push(socketId);
            cbBody.push(
                new Message(
                    msg.seq.toString(),
                    msg.subject.split('.').pop(),
                    _this.stringCodec.decode(msg.data),
                    msg.info.timestampNanos
                )
            );
            cb(null, ...cbBody);
        });

        const subscription = await this.jetstreamClient.subscribe(_subject, opts);
        const subcriptionsId = subscription.getID();
        this.subcriptions.set(subcriptionsId, subscription);
        return subcriptionsId;
    }

    public unsubscribe(subcriptionsId: number): void {
        const subscription = this.subcriptions.get(subcriptionsId);
        if (subscription) {
            subscription.unsubscribe();
            this.subcriptions.delete(subcriptionsId);
        }
        return;
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

        return consumers.some((consumerInfo) => {
            return consumerInfo.name === consumer;
        });
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

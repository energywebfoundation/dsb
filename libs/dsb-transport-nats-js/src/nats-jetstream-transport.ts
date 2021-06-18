import {
    ChannelAlreadyCreatedError,
    ChannelNotFoundError,
    ITransport,
    Message
} from '@energyweb/dsb-transport-core';
import { Logger } from '@nestjs/common';
import { AckPolicy, connect, NatsConnection, StringCodec } from 'nats';

import { fqcnToStream } from './fqcn-utils';

export class NATSJetstreamTransport implements ITransport {
    private stringCodec = StringCodec();
    private readonly logger = new Logger(NATSJetstreamTransport.name);
    private readonly connection: Promise<NatsConnection>;

    constructor(servers: string[]) {
        this.connection = connect({ servers });
    }

    public async publish(fqcn: string, payload: string): Promise<string> {
        const jetstream = (await this.connection).jetstream();
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
        const jetstreamManager = await (await this.connection).jetstreamManager();

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
        const jetstreamManager = await (await this.connection).jetstreamManager();

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
        await this.ensureConsumerExists(fqcn, clientId);

        const { stream } = fqcnToStream(fqcn);
        const jetstream = (await this.connection).jetstream();

        let counter = amount;
        const res: Message[] = [];

        //TODO: consider using fetch with batch size
        while (counter--) {
            try {
                const message = await jetstream.pull(stream, clientId);
                message.ack();

                res.push(
                    new Message(message.seq.toString(), this.stringCodec.decode(message.data))
                );
            } catch (e) {
                this.logger.error(e);

                if (e.toString().includes('no messages')) {
                    this.logger.log(`All messages from stream ${stream} has been pulled.`);
                    break;
                }

                if (e.toString().includes('stream not found')) {
                    throw new ChannelNotFoundError(fqcn);
                }
            }
        }

        return res;
    }

    private async ensureConsumerExists(fqcn: string, clientId: string) {
        const jetstreamManager = await (await this.connection).jetstreamManager();
        const { stream } = fqcnToStream(fqcn);
        let consumerInfo;

        try {
            consumerInfo = await jetstreamManager.consumers.info(stream, clientId);
        } catch (e) {
        } finally {
            if (!consumerInfo) {
                this.logger.log(
                    `Consumer with clientId ${clientId} does not exist. Attempting to create it.`
                );
                try {
                    await jetstreamManager.consumers.add(stream, {
                        name: clientId,
                        durable_name: clientId,
                        ack_policy: AckPolicy.Explicit
                    });
                } catch (e) {
                    this.logger.error(e);
                    if (e.toString().includes('stream not found')) {
                        throw new ChannelNotFoundError(fqcn);
                    }
                }
            }
        }
    }
}

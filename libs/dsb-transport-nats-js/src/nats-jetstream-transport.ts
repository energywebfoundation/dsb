import {
    ChannelAlreadyCreatedError,
    ChannelNotFoundError,
    ITransport
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

    public async pull(fqcn: string, clientId: string, amount: number): Promise<string[]> {
        const jetstreamManager = await (await this.connection).jetstreamManager();
        const { stream, subject } = fqcnToStream(fqcn);

        try {
            await jetstreamManager.consumers.info(stream, clientId);
        } catch (e) {
            this.logger.log(
                `Consumer with clientId ${clientId} does not exist. Attempting to create it.`
            );
            //TODO: NatsError: consumer not found
            await jetstreamManager.consumers.add(stream, {
                name: clientId,
                durable_name: clientId,
                ack_policy: AckPolicy.Explicit
            });
        }

        const jetstream = (await this.connection).jetstream();

        let counter = amount;
        const res: string[] = [];

        //TODO: consider implementing this using p-map https://github.com/sindresorhus/p-map
        while (counter--) {
            try {
                const message = await jetstream.pull(stream, clientId);
                message.ack();

                res.push(this.stringCodec.decode(message.data));
            } catch (error) {
                this.logger.error(error.toString());

                if (error.toString().includes('no messages')) {
                    this.logger.log(`All messages from stream ${stream} has been pulled.`);
                    break;
                }
            }
        }

        return res;
    }
}

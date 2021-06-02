import { ITransport } from '@energyweb/dsb-transport-core';

export class NATSJetstreamTransport implements ITransport {
    send(): void {
        throw new Error('Method not implemented.');
    }
}

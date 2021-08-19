import { ChannelNotFoundError, TransportUnavailableError } from '@energyweb/dsb-transport-core';
import {
    BadRequestException,
    InternalServerErrorException,
    ServiceUnavailableException
} from '@nestjs/common';

export const messageErrorHandler = (error: any) => {
    if (error instanceof ChannelNotFoundError) {
        throw new BadRequestException({ message: error.message });
    }
    if (error instanceof TransportUnavailableError) {
        throw new ServiceUnavailableException();
    }

    if (
        error.message === 'Unauthorized to publish this message.' ||
        error.message === 'Unauthorized to subscribe.' ||
        error.message === 'Payload does not match the schema for the topic.'
    )
        throw new BadRequestException({ message: error.message });

    throw new InternalServerErrorException({
        message: `Unable to publish a message due an unknown error`
    });
};

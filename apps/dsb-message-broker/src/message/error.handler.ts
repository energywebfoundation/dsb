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
        error.message === 'Not authorized to publish' ||
        error.message === 'Not authorized to subscribe'
    )
        throw new BadRequestException({ message: error.message });

    throw new InternalServerErrorException({
        message: `Unable to publish a message due an unknown error`
    });
};

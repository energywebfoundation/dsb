import {
    ChannelNotFoundError,
    ChannelAlreadyCreatedError,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';
import {
    BadRequestException,
    InternalServerErrorException,
    ServiceUnavailableException
} from '@nestjs/common';

export const channelErrorHandler = (error: any) => {
    if (error instanceof ChannelNotFoundError) {
        throw new BadRequestException({ message: error.message });
    }
    if (error instanceof TransportUnavailableError) {
        throw new ServiceUnavailableException();
    }
    if (error instanceof ChannelAlreadyCreatedError) {
        throw new BadRequestException({ message: error.message });
    }

    throw new InternalServerErrorException({
        message: `Unable to publish a message due an unknown error`
    });
};

import {
    BadRequestException,
    InternalServerErrorException,
    ServiceUnavailableException,
    NotFoundException
} from '@nestjs/common';

import {
    ChannelNotFoundError,
    ChannelAlreadyCreatedError,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';

import { FqcnNotQualifiedError, FqcnNotMatchedError, TopicSchemaNotValid } from './error';

export const ChannelErrorHandler = (error: any) => {
    if (
        error instanceof ChannelAlreadyCreatedError ||
        error instanceof FqcnNotQualifiedError ||
        error instanceof FqcnNotMatchedError ||
        error instanceof TopicSchemaNotValid
    ) {
        throw new BadRequestException({
            statusCode: 400,
            message: error.message,
            error: 'Bad Request'
        });
    }

    if (error instanceof ChannelNotFoundError) {
        throw new NotFoundException({
            statusCode: 404,
            message: error.message,
            error: 'Not Found'
        });
    }

    if (error instanceof TransportUnavailableError) {
        throw new ServiceUnavailableException();
    }

    throw new InternalServerErrorException();
};

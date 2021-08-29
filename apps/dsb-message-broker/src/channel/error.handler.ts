import {
    BadRequestException,
    UnauthorizedException,
    InternalServerErrorException,
    ServiceUnavailableException,
    NotFoundException
} from '@nestjs/common';

import {
    ChannelNotFoundError,
    ChannelAlreadyCreatedError,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';

import {
    FqcnNotQualifiedError,
    FqcnNotMatchedError,
    TopicSchemaNotValid,
    UnauthorizedToGetError,
    UnauthorizedToModifyError,
    UnauthorizedToRemoveError
} from './error';

// TODO: changing errors to exceptions and error handlers to exception filters

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

    if (
        error instanceof UnauthorizedToGetError ||
        error instanceof UnauthorizedToModifyError ||
        error instanceof UnauthorizedToRemoveError
    ) {
        throw new UnauthorizedException({
            statusCode: 401,
            message: error.message,
            error: 'Unauthorized'
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

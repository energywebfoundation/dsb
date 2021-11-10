import { ValidationError } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import {
    ChannelNotFoundError,
    ChannelOrTopicNotFoundError,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';

import {
    UnauthorizedToPublishError,
    UnauthorizedToSubscribeError,
    PayloadNotValidError
} from './error';

export const WsValidationErrorHandler = (error: ValidationError) => {
    throw new WsException({
        statusCode: 400,
        message: error.constraints ?? `${error.value} failed in validation`,
        error: 'Bad Request'
    });
};

export const WsMessageErrorHandler = (error: Error) => {
    if (error instanceof PayloadNotValidError) {
        throw new WsException({
            statusCode: 400,
            message: error.message,
            error: 'Bad Request'
        });
    }

    if (
        error instanceof UnauthorizedToPublishError ||
        error instanceof UnauthorizedToSubscribeError
    ) {
        throw new WsException({
            statusCode: 401,
            message: error.message,
            error: 'Unauthorized'
        });
    }

    if (error instanceof ChannelNotFoundError || error instanceof ChannelOrTopicNotFoundError) {
        throw new WsException({
            statusCode: 404,
            message: error.message,
            error: 'Not Found'
        });
    }

    if (error instanceof TransportUnavailableError) {
        throw new WsException({
            statusCode: 503,
            message: error.message,
            error: 'Service Unavailable'
        });
    }

    throw new WsException({
        statusCode: 503,
        message: `Unable to publish a message due an unknown error`,
        error: 'Internal Server Error'
    });
};

import {
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable,
    NestInterceptor
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
    ChannelNotFoundError,
    TransportUnavailableError,
    MessageExceedsMaximumSizeError,
    ChannelOrTopicNotFoundError
} from '@energyweb/dsb-transport-core';
import {
    PayloadNotValidError,
    PayloadNotValidJsonError,
    PayloadNotValidXmlError,
    UnauthorizedToPublishError,
    UnauthorizedToSubscribeError
} from './error';

@Injectable()
export class MessageInterceptor implements NestInterceptor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((error) => {
                let statusCode, message;

                if (
                    error instanceof PayloadNotValidError ||
                    error instanceof PayloadNotValidJsonError ||
                    error instanceof PayloadNotValidXmlError ||
                    error instanceof MessageExceedsMaximumSizeError
                ) {
                    statusCode = 400;
                }
                if (
                    error instanceof UnauthorizedToPublishError ||
                    error instanceof UnauthorizedToSubscribeError
                ) {
                    statusCode = 401;
                }
                if (
                    error instanceof ChannelNotFoundError ||
                    error instanceof ChannelOrTopicNotFoundError
                ) {
                    statusCode = 404;
                }
                if (error instanceof TransportUnavailableError) {
                    statusCode = 503;
                }

                if (statusCode) {
                    try {
                        message = JSON.parse(error.message);
                    } catch (err) {
                        message = [error.message];
                    }

                    throw new HttpException(
                        {
                            statusCode,
                            message
                        },
                        statusCode
                    );
                }

                throw error;
            })
        );
    }
}

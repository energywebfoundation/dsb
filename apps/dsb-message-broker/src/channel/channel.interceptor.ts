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
    ChannelAlreadyCreatedError,
    TransportUnavailableError
} from '@energyweb/dsb-transport-core';

import {
    FqcnNotQualifiedError,
    FqcnNotMatchedError,
    TopicSchemaNotValidError,
    UnauthorizedToGetError,
    UnauthorizedToModifyError,
    UnauthorizedToRemoveError
} from './error';

@Injectable()
export class ChannelInterceptor implements NestInterceptor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((error) => {
                let statusCode, message;

                if (
                    error instanceof ChannelAlreadyCreatedError ||
                    error instanceof FqcnNotQualifiedError ||
                    error instanceof FqcnNotMatchedError ||
                    error instanceof TopicSchemaNotValidError
                ) {
                    statusCode = 400;
                }
                if (
                    error instanceof UnauthorizedToGetError ||
                    error instanceof UnauthorizedToModifyError ||
                    error instanceof UnauthorizedToRemoveError
                ) {
                    statusCode = 401;
                }
                if (error instanceof ChannelNotFoundError) {
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

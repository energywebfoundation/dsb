import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException } from '@nestjs/common';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger();

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        let statusCode = 500,
            message = ['Error Message Undefined'];

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const response: any = exception.getResponse();

            if (response.message) {
                message =
                    typeof response.message === 'string' ? [response.message] : response.message;
            } else {
                message = typeof response === 'string' ? [response] : response;
            }
        } else if (exception instanceof Error) {
            message =
                typeof exception.message === 'string' ? [exception.message] : exception.message;
        }

        const { app, method, url } = request;

        this.logger.error({
            request: { app, method, url },
            message: `${statusCode} - ${JSON.stringify(message)}`
        });

        if (statusCode === 401 || statusCode === 403) {
            this.logger.error({
                request: { app, method, url },
                message: `${statusCode} - token: ${request.headers.authorization}`
            });
            this.logger.error({
                request: { app, method, url },
                message: `${statusCode} - ip: ${request.ip}`
            });
        }

        if (statusCode === 500) message = ['Internal Server Error'];

        response.status(statusCode).send({
            statusCode,
            message
        });
    }
}

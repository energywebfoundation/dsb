import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class HTTPLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const beginning = Date.now();
        const request = context.switchToHttp().getRequest();
        const { app, method, url } = request;

        this.logger.log({
            request: { app, method, url },
            message: `user: ${request.user?.did}`
        });

        return next.handle().pipe(
            tap(() => {
                const delay = Date.now() - beginning;
                this.logger.log({
                    request: { app, method, url },
                    message: `response with success - response time: ${delay}ms`
                });
            }),
            catchError((error) => {
                const delay = Date.now() - beginning;
                this.logger.log({
                    request: { app, method, url },
                    message: `response with error - response time: ${delay}ms`
                });
                return throwError(error);
            })
        );
    }
}

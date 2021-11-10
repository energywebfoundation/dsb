import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GlobalInterceptor implements NestInterceptor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        request.uuid = uuidv4();
        return next.handle();
    }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req?.method;
    const url = req?.url;

    const start = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const time = Date.now() - start;
        console.log(`HTTP ${method} ${url} - ${time}ms`);
        console.log('Resposta:', response);
      }),
    );
  }
}

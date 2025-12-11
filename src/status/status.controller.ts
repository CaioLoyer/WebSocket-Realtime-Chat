import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

@Controller('status')
@UseInterceptors(LoggingInterceptor)
export class StatusController {
  @Get()
  getStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

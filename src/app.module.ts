import { Module } from '@nestjs/common';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { StatusController } from './status/status.controller';

@Module({
  imports: [ChatModule],
  controllers: [AppController, StatusController],
  providers: [AppService],
})
export class AppModule {}

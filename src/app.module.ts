import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { StatusController } from './status/status.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', '..'),
      serveRoot: '/',
      renderPath: '/',
      serveStaticOptions: { index: 'chat.html' },
    }),
    ChatModule,
  ],
  controllers: [AppController, StatusController],
  providers: [AppService],
})
export class AppModule {}

import {
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private typingUsers: Record<string, Set<string>> = {};

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  handleMessage(@MessageBody() payload: { user: string; message: string }) {
    // Remove user from global typing list when sending a message
    this.typingUsers['global']?.delete(payload.user);
    this.server
      .to('global')
      .emit('users_typing_update', Array.from(this.typingUsers['global'] || []));

    this.server.emit('new_message', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { lang: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.lang) {
      client.join(data.lang);
    }
  }

  @SubscribeMessage('send_message_lang')
  handleLanguageMessage(
    @MessageBody()
    data: { user: string; message: string; lang: string },
  ) {
    const { message, lang, user } = data;

    if (!lang) {
      return;
    }

 
    this.typingUsers[lang]?.delete(user);
    this.server
      .to(lang)
      .emit('users_typing_update', Array.from(this.typingUsers[lang] || []));

    this.server.to(lang).emit('new_message_lang', {
      user,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { user: string; room: string }) {
    const { user, room } = data;
    if (!room) return;
    if (!this.typingUsers[room]) {
      this.typingUsers[room] = new Set();
    }
    this.typingUsers[room].add(user);
    this.server
      .to(room)
      .emit('users_typing_update', Array.from(this.typingUsers[room]));
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(@MessageBody() data: { user: string; room: string }) {
    const { user, room } = data;
    if (!room || !this.typingUsers[room]) return;
    this.typingUsers[room].delete(user);
    this.server
      .to(room)
      .emit('users_typing_update', Array.from(this.typingUsers[room]));
  }
}

import {
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageFormatPipe } from './pipes/message-format.pipe';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private typingUsers: Record<string, Set<string>> = {};
  private userSockets: Map<string, string> = new Map(); // user -> socketId

  handleConnection(client: Socket) {
    const address = client.handshake?.address;
    const timestamp = new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.log(
      `Cliente conectado: ${client.id} { status: 'ok', timestamp: '${timestamp}'${address ? `, address: '${address}'` : ''} }`,
    );
  }

  handleDisconnect(client: Socket) {
    const address = client.handshake?.address;
    const timestamp = new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.log(
      `Cliente desconectado: ${client.id} { status: 'disconnect', timestamp: '${timestamp}'${address ? `, address: '${address}'` : ''} }`,
    );
  }

  @SubscribeMessage('send_message')
  handleMessage(
    @MessageBody(MessageFormatPipe) payload: { user: string; message: string },
  ) {
    // Remove user from global typing list when sending a message
    this.typingUsers['global']?.delete(payload.user);
    this.server
      .to('global')
      .emit('users_typing_update', Array.from(this.typingUsers['global'] || []));

    this.server.emit('new_message', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    // Detect and notify mentions (global)
    const mentions = this.extractMentions(payload.message);
    mentions.forEach((mentionedUser) => {
      const socketId = this.userSockets.get(mentionedUser);
      if (socketId) {
        this.server.to(socketId).emit('highlight_message', {
          from: payload.user,
          message: payload.message,
          timestamp: new Date().toISOString(),
        });
      }
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
    @MessageBody(MessageFormatPipe)
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

    // Detect and notify mentions (language rooms)
    const mentions = this.extractMentions(message);
    mentions.forEach((mentionedUser) => {
      const socketId = this.userSockets.get(mentionedUser);
      if (socketId) {
        this.server.to(socketId).emit('highlight_message', {
          from: user,
          message: message,
          lang,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  @SubscribeMessage('register_user')
  handleRegisterUser(
    @MessageBody() data: { user: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.user) return;
    this.userSockets.set(data.user, client.id);
    console.log(`Usuário registrado: ${data.user} -> ${client.id}`);
  }

  private extractMentions(message: string): string[] {
    const regex = /@(\w+)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(message)) !== null) {
      matches.push(match[1]);
    }
    return matches;
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

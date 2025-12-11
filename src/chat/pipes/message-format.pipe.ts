import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MessageFormatPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value.message !== 'string') {
      throw new BadRequestException('Mensagem inválida.');
    }

    let msg = value.message.trim();

    if (msg.length === 0) {
      throw new BadRequestException('Mensagem vazia .');
    }

    if (msg.length > 200) {
      msg = msg.slice(0, 200) + '...';
    }

    const bannedWords = ['merda', 'porra', 'caralho',"filha da puta","fdp","Buceta"];
    bannedWords.forEach((w) => {
      const regex = new RegExp(w, 'gi');
      msg = msg.replace(regex, '****');
    });

    return {
      ...value,
      message: msg,
    };
  }
}

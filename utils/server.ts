import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  key: string,
  messages: Message[],
) => {
  // ... rest of the implementation
}; 
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
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: model.id,
      messages: messages,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(`OpenAI API returned an error: ${res.statusText}`);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0]?.delta?.content || '';
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};

type ParsedEvent = {
  type: string;
  data: string;
};

type ReconnectInterval = {
  type: string;
  value: number;
};

function createParser(onParse: (event: ParsedEvent | ReconnectInterval) => void) {
  let buffer = '';
  return {
    feed(chunk: string) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          onParse({ type: 'event', data: line.slice(6) });
        } else if (line.startsWith('retry: ')) {
          onParse({ type: 'reconnect-interval', value: Number(line.slice(7)) });
        }
      }
    },
  };
} 
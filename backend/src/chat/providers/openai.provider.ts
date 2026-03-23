import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider, AIResponse, ChatMessage, GenerateOpts, TokenEstimate } from './ai-provider.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly providerName = 'OPENAI';
  private client: OpenAI;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY', '') });
  }

  async generateText(messages: ChatMessage[], opts: GenerateOpts = {}): Promise<AIResponse> {
    const modelName = opts.modelName || 'gpt-4o-mini';
    const result = await this.client.chat.completions.create({
      model: modelName,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: opts.maxOutputTokens,
    });

    const choice = result.choices[0];
    return {
      content: choice.message.content || '',
      tokensIn: result.usage?.prompt_tokens || 0,
      tokensOut: result.usage?.completion_tokens || 0,
      finishReason: choice.finish_reason || 'stop',
      modelName,
      provider: 'OPENAI',
    };
  }

  async *streamText(messages: ChatMessage[], opts: GenerateOpts = {}): AsyncGenerator<string> {
    const modelName = opts.modelName || 'gpt-4o-mini';
    const stream = await this.client.chat.completions.create({
      model: modelName,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  async estimateUsage(text: string): Promise<TokenEstimate> {
    return { tokens: Math.ceil(text.length / 4) };
  }
}

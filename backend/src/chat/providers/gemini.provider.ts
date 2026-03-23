import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { AIProvider, AIResponse, ChatMessage, GenerateOpts, TokenEstimate } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly providerName = 'GEMINI';
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    this.client = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY', ''));
  }

  async generateText(messages: ChatMessage[], opts: GenerateOpts = {}): Promise<AIResponse> {
    const modelName = opts.modelName || 'gemini-1.5-flash';
    const model = this.client.getGenerativeModel({
      model: modelName,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Build conversation history (all except last user message)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const text = response.text();

    const usage = response.usageMetadata;
    return {
      content: text,
      tokensIn: usage?.promptTokenCount || 0,
      tokensOut: usage?.candidatesTokenCount || 0,
      finishReason: response.candidates?.[0]?.finishReason?.toString() || 'stop',
      modelName,
      provider: 'GEMINI',
    };
  }

  async *streamText(messages: ChatMessage[], opts: GenerateOpts = {}): AsyncGenerator<string> {
    const modelName = opts.modelName || 'gemini-1.5-flash';
    const model = this.client.getGenerativeModel({ model: modelName });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }

  async estimateUsage(text: string): Promise<TokenEstimate> {
    // Rough estimate: ~4 chars per token
    return { tokens: Math.ceil(text.length / 4) };
  }
}

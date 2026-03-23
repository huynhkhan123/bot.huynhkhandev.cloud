import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AIProvider } from './providers/ai-provider.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  private providers: Map<string, AIProvider>;

  constructor(
    private prisma: PrismaService,
    private gemini: GeminiProvider,
    private openai: OpenAIProvider,
  ) {
    this.providers = new Map<string, AIProvider>([
      ['GEMINI', gemini],
      ['OPENAI', openai],
    ]);
  }

  async sendMessage(
    userId: string,
    conversationId: string | null,
    content: string,
    modelName: string = 'gemini-1.5-flash',
    providerName: string = 'GEMINI',
  ) {
    const requestId = uuidv4();
    const provider = this.getProvider(providerName);

    // Resolve or create conversation
    let conversation;
    if (conversationId) {
      conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId, deletedAt: null },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!conversation) throw new NotFoundException('Conversation not found');
    } else {
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          title: content.slice(0, 60).trim(),
          modelName,
          provider: providerName as 'GEMINI' | 'OPENAI',
        },
        include: { messages: true },
      });
    }

    // Save user message
    const userMessage = await this.prisma.message.create({
      data: { conversationId: conversation.id, role: 'user', content },
    });

    // Build chat history for AI
    const historyMessages = conversation.messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    historyMessages.push({ role: 'user', content });

    // Call AI provider
    let aiResponse;
    try {
      aiResponse = await provider.generateText(historyMessages, { modelName });
    } catch (err) {
      // Save error message and rethrow
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          finishReason: 'error',
          provider: providerName,
          modelName,
        },
      });
      throw err;
    }

    // Save assistant message
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        tokensUsed: aiResponse.tokensIn + aiResponse.tokensOut,
        provider: aiResponse.provider,
        modelName: aiResponse.modelName,
        finishReason: aiResponse.finishReason,
      },
    });

    // Log usage
    await this.prisma.usageLog.create({
      data: {
        requestId,
        userId,
        conversationId: conversation.id,
        messageId: assistantMessage.id,
        provider: aiResponse.provider,
        modelName: aiResponse.modelName,
        tokensIn: aiResponse.tokensIn,
        tokensOut: aiResponse.tokensOut,
        estimatedCost: this.estimateCost(aiResponse.provider, aiResponse.tokensIn, aiResponse.tokensOut),
      },
    });

    // Update conversation updatedAt + async title generation after first exchange
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      message: { id: assistantMessage.id, content: aiResponse.content, role: 'assistant' },
      usage: { tokensIn: aiResponse.tokensIn, tokensOut: aiResponse.tokensOut },
    };
  }

  private getProvider(name: string): AIProvider {
    const provider = this.providers.get(name.toUpperCase());
    if (!provider) throw new BadRequestException(`Unknown AI provider: ${name}`);
    return provider;
  }

  private estimateCost(provider: string, tokensIn: number, tokensOut: number): number {
    // Rough estimates (USD per 1M tokens)
    const rates: Record<string, { in: number; out: number }> = {
      GEMINI: { in: 0.075, out: 0.30 },
      OPENAI: { in: 0.15, out: 0.60 },
    };
    const rate = rates[provider] || { in: 0, out: 0 };
    return (tokensIn * rate.in + tokensOut * rate.out) / 1_000_000;
  }
}

import { Injectable } from '@nestjs/common';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateOpts {
  modelName?: string;
  maxOutputTokens?: number;
}

export interface AIResponse {
  content: string;
  tokensIn: number;
  tokensOut: number;
  finishReason: string;
  modelName: string;
  provider: string;
}

export interface TokenEstimate {
  tokens: number;
}

export interface AIProvider {
  generateText(messages: ChatMessage[], opts?: GenerateOpts): Promise<AIResponse>;
  streamText(messages: ChatMessage[], opts?: GenerateOpts): AsyncGenerator<string>;
  estimateUsage(text: string): Promise<TokenEstimate>;
  readonly providerName: string;
}

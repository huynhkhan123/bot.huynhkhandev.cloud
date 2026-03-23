'use client';

import Link from 'next/link';
import { Bot, Zap, Shield, MessageSquare, ArrowRight, Github } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">BotCloud</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/register" className="btn-primary">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center text-center pt-24 pb-20 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/10 border border-brand-600/20 text-brand-400 text-xs font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          Powered by Gemini & OpenAI
        </div>

        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight max-w-4xl mb-6 leading-[1.1]">
          Your AI assistant,{' '}
          <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
            built securely
          </span>
        </h1>

        <p className="text-gray-400 text-xl max-w-2xl mb-12 leading-relaxed">
          Chat with multiple AI models. Your API keys stay on our secure backend — 
          never exposed to the client. Full conversation history, quota management, and more.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="btn-primary text-base px-6 py-3">
            Start chatting free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-6 py-3">
            Sign in to your account
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-24 max-w-4xl w-full text-left">
          {[
            {
              icon: Shield,
              title: 'Secure by design',
              desc: 'AI API keys never leave the server. All requests go through our authenticated backend.',
            },
            {
              icon: MessageSquare,
              title: 'Full conversation history',
              desc: 'Every conversation saved and organized. Pick up where you left off, any time.',
            },
            {
              icon: Zap,
              title: 'Multiple models',
              desc: 'Switch between Gemini, GPT-4o, and more — all through one unified interface.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-brand-600/30 transition-colors duration-200">
              <div className="w-10 h-10 bg-brand-600/15 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-semibold text-gray-100 mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 flex items-center justify-center text-gray-600 text-sm">
        © 2026 BotCloud · bot.huynhkhandev.cloud
      </footer>
    </div>
  );
}

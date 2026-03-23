'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot, Send, Plus, Trash2, LogOut, User, MessageSquare, Loader2, Menu, X, Settings,
  ChevronDown,
} from 'lucide-react';
import { authApi, chatApi, conversationsApi } from '@/lib/api';
import { useAuthStore, useChatStore } from '@/store';
import clsx from 'clsx';
import Link from 'next/link';

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-gray-500 rounded-full animate-pulse-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  return (
    <div className={clsx('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={clsx(
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm',
        )}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-gray-300" />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { conversations, activeConversationId, messages, setConversations, setActiveConversation, addMessage, setMessages, addConversation, removeConversation } =
    useChatStore();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  // Validate session on mount
  useEffect(() => {
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => { logout(); router.push('/login'); });
  }, []);

  // Load conversations
  useEffect(() => {
    conversationsApi.list().then((data) => {
      setConversations(data);
      setLoadingConvs(false);
    });
  }, []);

  // Load messages when switching conversations
  useEffect(() => {
    if (activeConversationId && !messages[activeConversationId]) {
      conversationsApi.getMessages(activeConversationId).then((data) => {
        setMessages(activeConversationId, data);
      });
    }
  }, [activeConversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || isTyping) return;

    setInput('');
    const tempMsg = { id: 'temp-' + Date.now(), role: 'user', content, createdAt: new Date().toISOString() };

    const convId = activeConversationId;
    if (convId) addMessage(convId, tempMsg);
    setIsTyping(true);

    try {
      const res = await chatApi.send({ content, conversationId: convId || undefined });
      const newConvId = res.conversationId;

      if (!convId) {
        // New conversation created — refresh list
        const convs = await conversationsApi.list();
        setConversations(convs);
        setActiveConversation(newConvId);
        setMessages(newConvId, [tempMsg, { ...res.message, createdAt: new Date().toISOString() }]);
      } else {
        addMessage(convId, { ...res.message, createdAt: new Date().toISOString() });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to send message.';
      if (convId) {
        addMessage(convId, { id: 'err-' + Date.now(), role: 'assistant', content: `⚠️ ${errMsg}`, createdAt: new Date().toISOString() });
      }
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [input, isTyping, activeConversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push('/login');
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await conversationsApi.delete(id);
    removeConversation(id);
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
      )}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">BotCloud</span>
          </div>
        </div>

        {/* New chat */}
        <div className="p-3">
          <button
            onClick={() => setActiveConversation(null)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-400" />
            New conversation
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-6 px-4">No conversations yet. Start chatting!</p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={clsx(
                    'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm',
                    activeConversationId === conv.id
                      ? 'bg-brand-600/15 text-brand-300'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 truncate text-xs">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User section */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 bg-brand-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-brand-400">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{user?.username}</p>
              <p className="text-xs text-gray-600 truncate">{user?.subscription?.plan?.name || 'free'} plan</p>
            </div>
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-300 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost p-2">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-gray-200">
              {activeConversationId
                ? conversations.find((c) => c.id === activeConversationId)?.title || 'Conversation'
                : 'New conversation'}
            </h2>
          </div>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="btn-ghost text-xs">Admin</Link>
          )}
          <Link href="/profile" className="btn-ghost text-xs">
            <User className="w-3.5 h-3.5" />
            Profile
          </Link>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
            {currentMessages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <div className="w-14 h-14 bg-brand-600/15 rounded-2xl flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">How can I help you?</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Start a conversation. Ask anything — I'm powered by Gemini and ready to assist.
                </p>
              </div>
            )}

            {currentMessages.map((msg) => (
              <div key={msg.id} className="animate-slide-up">
                <MessageBubble message={msg} />
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  className="w-full resize-none input-field py-3.5 pr-12 min-h-[52px] max-h-40"
                  placeholder="Message BotCloud..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="btn-primary p-3.5 flex-shrink-0 rounded-xl disabled:opacity-40"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-700 text-center mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </main>
    </div>
  );
}

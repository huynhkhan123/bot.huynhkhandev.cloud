'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Suspense } from 'react';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card text-center">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-4" />
        <h3 className="font-semibold text-white mb-2">Check your email</h3>
        <p className="text-gray-400 text-sm mb-4">
          If <span className="text-gray-200">{email}</span> exists in our system, we&apos;ve sent a reset link.
        </p>
        <Link href="/login" className="btn-secondary text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="email"
              className="input-field pl-10"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-5 text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-brand-600/10 blur-[100px] rounded-full -z-10" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-600/30">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-gray-400 text-sm mt-1">We&apos;ll send you a link to get back in</p>
        </div>

        <Suspense fallback={<div className="card"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-400" /></div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

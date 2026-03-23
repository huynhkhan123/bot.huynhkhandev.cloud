'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired token. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card text-center">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-4" />
        <h3 className="font-semibold text-white mb-2">Password updated!</h3>
        <p className="text-gray-400 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="card text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h3 className="font-semibold text-white mb-2">Invalid link</h3>
        <p className="text-gray-400 text-sm mb-4">This reset link is invalid or has already been used.</p>
        <Link href="/forgot-password" className="btn-primary text-sm">Request new link</Link>
      </div>
    );
  }

  return (
    <div className="card">
      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-300 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">New password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type={showPass ? 'text' : 'password'}
              className="input-field pl-10 pr-12"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm new password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type={showPass ? 'text' : 'password'}
              className="input-field pl-10"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Saving...' : 'Set new password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-brand-600/10 blur-[100px] rounded-full -z-10" />
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-600/30">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-gray-400 text-sm mt-1">Choose a strong password</p>
        </div>
        <Suspense fallback={<div className="card"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-400" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

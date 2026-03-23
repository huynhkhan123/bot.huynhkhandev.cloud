'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, User, Mail, CreditCard, Shield, LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me()
      .then((u) => { setUser(u); setLoading(false); })
      .catch(() => { logout(); router.push('/login'); });
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/chat" className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-white">Profile</h1>
        </div>

        {/* Avatar + Name */}
        <div className="card flex items-center gap-5 mb-5">
          <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-brand-400">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.username}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded text-xs font-medium ${
              user?.role === 'ADMIN' ? 'bg-brand-600/20 text-brand-300' : 'bg-gray-700 text-gray-300'
            }`}>{user?.role}</span>
          </div>
        </div>

        {/* Plan info */}
        <div className="card mb-5">
          <div className="flex items-center gap-2.5 mb-4">
            <CreditCard className="w-4 h-4 text-brand-400" />
            <h3 className="font-medium text-gray-200">Current Plan</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold capitalize">{user?.subscription?.plan?.name || 'Free'}</p>
              <p className="text-gray-400 text-sm mt-0.5">
                {user?.subscription?.plan?.dailyMessageLimit || 20} messages/day ·{' '}
                {user?.subscription?.plan?.monthlyMessageLimit || 200} messages/month
              </p>
            </div>
            <span className="inline-flex px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-xs font-medium">Active</span>
          </div>
        </div>

        {/* Account info */}
        <div className="card mb-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Shield className="w-4 h-4 text-brand-400" />
            <h3 className="font-medium text-gray-200">Account</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Email verified</span>
              <span className={`text-sm font-medium ${user?.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                {user?.isEmailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400 text-sm">Password</span>
              <Link href="/forgot-password" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
                Change password
              </Link>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/30 
                     border border-red-800/40 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, MessageSquare, BarChart3, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import { authApi, adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';

export default function AdminPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authApi.me().then((u) => {
      setUser(u);
      if (u.role !== 'ADMIN') { router.push('/chat'); return; }
      Promise.all([adminApi.getStats(), adminApi.listUsers()]).then(([s, u]) => {
        setStats(s);
        setUsers(u.users);
        setLoading(false);
      });
    }).catch(() => router.push('/login'));
  }, []);

  const toggleStatus = async (id: string, current: boolean) => {
    await adminApi.updateUserStatus(id, !current);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !current } : u));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users },
            { label: 'Active Users', value: stats.activeUsers, icon: CheckCircle2 },
            { label: 'Conversations', value: stats.totalConversations, icon: MessageSquare },
            { label: 'Messages', value: stats.totalMessages, icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card">
              <Icon className="w-5 h-5 text-brand-400 mb-2" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
          <h2 className="font-semibold text-gray-200 flex-1">Users</h2>
          <input
            type="text"
            placeholder="Search..."
            className="input-field w-48 py-2 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                {['Email', 'Username', 'Role', 'Plan', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {users
                .filter((u) => !search || u.email.includes(search) || u.username.includes(search))
                .map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-gray-200 text-xs">{u.email}</td>
                    <td className="px-5 py-3.5 text-gray-300 text-xs">{u.username}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-brand-600/20 text-brand-300' : 'bg-gray-700 text-gray-300'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{u.subscription?.plan?.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        u.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>{u.isActive ? 'Active' : 'Suspended'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {user?.id !== u.id && (
                        <button
                          onClick={() => toggleStatus(u.id, u.isActive)}
                          className={`btn-ghost py-1 text-xs ${u.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                        >
                          {u.isActive ? <><Ban className="w-3.5 h-3.5" /> Suspend</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

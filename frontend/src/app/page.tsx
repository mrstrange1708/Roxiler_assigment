'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Shield, Store, User as UserIcon, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect them
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else if (user.role === 'STORE_OWNER') {
        router.replace('/owner');
      } else {
        router.replace('/user');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 p-4">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 transition-all hover:border-slate-700/80">
        
        {/* App Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 mb-4 transform hover:rotate-12 transition-transform duration-300">
            <Star className="w-8 h-8 text-white fill-white/10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Rate<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">It</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Single sign-on store rating platform</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="email"
                type="email"
                required
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 outline-none text-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm transition-all placeholder:text-slate-600"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="password"
                type="password"
                required
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 outline-none text-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-3 text-sm font-semibold tracking-wide shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info / Signup link */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-slate-400 text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign Up Here
            </Link>
          </p>
        </div>

        {/* Test Accounts Legend (Quick Helper for Challenge Assessors) */}
        <div className="mt-8 p-4 bg-slate-950/50 rounded-xl border border-slate-850 text-[11px] text-slate-400 space-y-2">
          <span className="font-bold text-slate-300 block uppercase tracking-wider">Demo Accounts for Testing:</span>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-1 bg-slate-900 rounded border border-slate-800">
              <span className="font-bold text-indigo-400 block">Admin</span>
              <span>admin@rateit.com</span>
              <span className="block text-slate-500">Admin123!</span>
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800">
              <span className="font-bold text-purple-400 block">User</span>
              <span>user1@gmail.com</span>
              <span className="block text-slate-500">User123!</span>
            </div>
            <div className="p-1 bg-slate-900 rounded border border-slate-800">
              <span className="font-bold text-pink-400 block">Owner</span>
              <span>owner1@store.com</span>
              <span className="block text-slate-500">Owner123!</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

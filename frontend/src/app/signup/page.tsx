'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Mail, Lock, User as UserIcon, Home as HomeIcon, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const tempErrors: Record<string, string> = {};

    // Name: Min 20, Max 60
    if (name.trim().length < 20 || name.trim().length > 60) {
      tempErrors.name = 'Name must be between 20 and 60 characters.';
    }

    // Email: Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      tempErrors.email = 'Please enter a valid email address.';
    }

    // Address: Max 400
    if (address.trim().length === 0) {
      tempErrors.address = 'Address is required.';
    } else if (address.trim().length > 400) {
      tempErrors.address = 'Address must not exceed 400 characters.';
    }

    // Password: 8-16, 1 uppercase, 1 special character
    if (password.length < 8 || password.length > 16) {
      tempErrors.password = 'Password must be between 8 and 16 characters.';
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasSpecial = /[^a-zA-Z0-9]/.test(password);
      if (!hasUppercase) {
        tempErrors.password = 'Password must contain at least one uppercase letter.';
      } else if (!hasSpecial) {
        tempErrors.password = 'Password must contain at least one special character.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, address, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          throw new Error('Please fix the validation errors.');
        }
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMsg('Registration successful! Redirecting to login page...');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 p-4">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 hover:border-slate-700/80 transition-all">
        
        {/* Navigation back */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join the platform to discover and rate local stores</p>
        </div>

        {/* Global Feedback */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Name Field */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider" htmlFor="name">
                Full Name
              </label>
              <span className="text-[10px] text-slate-500">Must be 20 - 60 chars</span>
            </div>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="name"
                type="text"
                required
                className={`w-full bg-slate-950/40 border ${errors.name ? 'border-red-500/65 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500/80'} outline-none text-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm transition-all placeholder:text-slate-600`}
                placeholder="Johnathan Doe Harrison Junior (Min 20 characters)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {errors.name && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.name}</p>}
          </div>

          {/* Email Field */}
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
                className={`w-full bg-slate-950/40 border ${errors.email ? 'border-red-500/65 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500/80'} outline-none text-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm transition-all placeholder:text-slate-600`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email}</p>}
          </div>

          {/* Address Field */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider" htmlFor="address">
                Residential Address
              </label>
              <span className="text-[10px] text-slate-500">Max 400 chars ({address.length}/400)</span>
            </div>
            <div className="relative">
              <HomeIcon className="absolute left-3 top-4 w-5 h-5 text-slate-500" />
              <textarea
                id="address"
                required
                rows={3}
                className={`w-full bg-slate-950/40 border ${errors.address ? 'border-red-500/65 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500/80'} outline-none text-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm transition-all placeholder:text-slate-600 resize-none`}
                placeholder="Enter your full street address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            {errors.address && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.address}</p>}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <span className="text-[10px] text-slate-500">8-16 chars, 1 uppercase, 1 special</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="password"
                type="password"
                required
                className={`w-full bg-slate-950/40 border ${errors.password ? 'border-red-500/65 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500/80'} outline-none text-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm transition-all placeholder:text-slate-600`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-3 text-sm font-semibold tracking-wide shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                Registering Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In
          </Link>
        </div>

      </div>
    </main>
  );
}

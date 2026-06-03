'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Star,
  LogOut,
  ArrowUpDown,
  Loader2,
  KeyRound,
  AlertCircle,
  CheckCircle,
  Users,
  Store,
  Calendar,
  X
} from 'lucide-react';

interface RaterItem {
  ratingId: string;
  rating: number;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAddress: string;
}

interface DashboardData {
  storeId: string;
  storeName: string;
  storeAddress: string;
  averageRating: number;
  totalRatings: number;
  raters: RaterItem[];
}

export default function OwnerDashboard() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if unauthorized
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'STORE_OWNER')) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // Dashboard Data State
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        sortBy,
        sortOrder,
      }).toString();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/owner/dashboard?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to load dashboard data.');
      }

      setData(resData);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [token, sortBy, sortOrder]);

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token, fetchDashboard]);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Password Update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    // Clientside password check
    if (passwords.newPassword.length < 8 || passwords.newPassword.length > 16) {
      setPassError('Password must be between 8 and 16 characters.');
      return;
    }
    const hasUppercase = /[A-Z]/.test(passwords.newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(passwords.newPassword);
    if (!hasUppercase) {
      setPassError('Password must include at least one uppercase letter.');
      return;
    }
    if (!hasSpecial) {
      setPassError('Password must include at least one special character.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwords),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update password.');
      }

      setPassSuccess('Password updated successfully!');
      setPasswords({ oldPassword: '', newPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Something went wrong.');
    } finally {
      setPassLoading(false);
    }
  };

  if (authLoading || !user || user.role !== 'STORE_OWNER') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      
      {/* Header bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Owner Hub</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Business Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-200">{user.name}</span>
            <span className="text-[10px] bg-pink-500/20 text-pink-300 font-bold px-2 py-0.5 rounded border border-pink-500/30 uppercase tracking-widest">Store Owner</span>
          </div>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg px-3 py-2 text-xs font-semibold border border-slate-800 active:scale-[0.98] transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Update Password
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg px-3.5 py-2 text-sm font-medium border border-slate-750 active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* Dashboard Stats */}
        {data && (
          <>
            <section className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Logged Business Store</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">{data.storeName}</h2>
                <p className="text-slate-400 text-xs mt-1">{data.storeAddress}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card A: Average Rating */}
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 shadow-lg shadow-indigo-950/5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Star className="w-8 h-8 fill-amber-400/20" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Average Rating</p>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-4xl font-extrabold text-white">{data.averageRating}</span>
                    <span className="text-sm text-slate-500 font-semibold">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Card B: Rater Counts */}
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 shadow-lg shadow-indigo-950/5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Customer Reviews</p>
                  <p className="text-4xl font-extrabold text-white mt-1">{data.totalRatings}</p>
                </div>
              </div>
            </section>

            {/* Customers Ratings Listing */}
            <section className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Customer Ratings Directory
              </h3>

              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
                {loading ? (
                  <div className="p-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-slate-400 text-xs">Re-sorting listings...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase font-bold tracking-wider">
                          <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                              Customer Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </th>
                          <th onClick={() => handleSort('email')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                              Customer Email <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </th>
                          <th onClick={() => handleSort('address')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                              Address <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </th>
                          <th onClick={() => handleSort('rating')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                              Rating Submitted <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </th>
                          <th onClick={() => handleSort('date')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                              Submission Date <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60">
                        {data.raters.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-12 text-slate-500">
                              No customer ratings have been submitted for your store yet.
                            </td>
                          </tr>
                        ) : (
                          data.raters.map((r) => (
                            <tr key={r.ratingId} className="hover:bg-slate-900/10 transition-colors">
                              <td className="p-4 font-bold text-slate-200 whitespace-nowrap">{r.userName}</td>
                              <td className="p-4 text-slate-300 font-mono">{r.userEmail}</td>
                              <td className="p-4 text-slate-400 max-w-xs truncate">{r.userAddress}</td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= r.rating ? 'text-indigo-400 fill-indigo-400/80' : 'text-slate-800'
                                      }`}
                                    />
                                  ))}
                                  <span className="font-bold ml-1 text-slate-200">{r.rating}</span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap text-slate-400 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* --- PASSWORD UPDATE MODAL --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Update Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassError(null);
                  setPassSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
              {passError && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  {passSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-slate-300 text-[10px] font-bold uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 rounded-xl py-2 px-3 text-xs transition-all"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="block text-slate-300 text-[10px] font-bold uppercase">New Password</label>
                  <span className="text-[8px] text-slate-500">8-16 chars, 1 uppercase, 1 special</span>
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 rounded-xl py-2 px-3 text-xs transition-all"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {passLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

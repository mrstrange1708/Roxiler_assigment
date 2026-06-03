'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Star,
  LogOut,
  Search,
  ArrowUpDown,
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle,
  Building,
  KeyRound,
  User as UserIcon,
  Home as HomeIcon,
  X
} from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  address: string;
  email: string;
  averageRating: number;
  totalRatings: number;
  userSubmittedRating: number | null;
}

export default function UserDashboard() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if unauthorized
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'USER')) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // Stores State
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  // Rating action feedback
  const [ratingLoadingStoreId, setRatingLoadingStoreId] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // Fetch stores list
  const fetchStores = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
      }).toString();
      const res = await fetch(`http://localhost:5001/api/stores?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (e) {
      console.error('Error fetching stores:', e);
    } finally {
      setLoading(false);
    }
  }, [token, search, sortBy, sortOrder]);

  useEffect(() => {
    if (token) {
      fetchStores();
    }
  }, [token, fetchStores]);

  // Handle click to rate
  const handleRate = async (storeId: string, ratingValue: number) => {
    if (!token) return;
    setRatingLoadingStoreId(storeId);
    setRatingError(null);

    try {
      const res = await fetch('http://localhost:5001/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storeId, rating: ratingValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit rating.');
      }

      // Re-fetch stores list to recalculate overall rating
      await fetchStores();
    } catch (err: any) {
      setRatingError(err.message || 'Something went wrong while rating.');
    } finally {
      setRatingLoadingStoreId(null);
    }
  };

  // Sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Password update
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
      const res = await fetch('http://localhost:5001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwords),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
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

  if (authLoading || !user || user.role !== 'USER') {
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
            <Star className="w-5 h-5 text-white fill-white/10" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">RateIt</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">User Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-200">{user.name}</span>
            <span className="text-[10px] text-slate-450 font-medium truncate max-w-xs">{user.email}</span>
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

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* User Card Legend */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Welcome back, {user.name.split(' ')[0]}!</h2>
            <p className="text-slate-400 text-xs">Search for your favorite stores, check their overall scores, and rate them 1-5 stars.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <span>{user.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HomeIcon className="w-4 h-4 text-indigo-400" />
              <span className="max-w-[200px] truncate">{user.address}</span>
            </div>
          </div>
        </section>

        {/* Filters and List */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs transition-all placeholder:text-slate-500"
                placeholder="Search stores by Name or Address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0 self-end">
              <Building className="w-4 h-4 text-indigo-400" />
              Showing {stores.length} registered business stores
            </div>
          </div>

          {ratingError && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              {ratingError}
            </div>
          )}

          {/* Table Container */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-slate-400 text-xs">Fetching registered stores list...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase font-bold tracking-wider">
                      <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                        <div className="flex items-center gap-1.5">
                          Store Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('address')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                        <div className="flex items-center gap-1.5">
                          Address <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('rating')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                        <div className="flex items-center gap-1.5">
                          Overall Rating <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('myRating')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                        <div className="flex items-center gap-1.5">
                          My Rating <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </th>
                      <th className="p-4 text-slate-400">Submit/Modify Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-12 text-slate-500">
                          No stores registered on the platform matching your search.
                        </td>
                      </tr>
                    ) : (
                      stores.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="p-4 font-bold text-slate-200 whitespace-nowrap">{s.name}</td>
                          <td className="p-4 text-slate-400 max-w-sm truncate">{s.address}</td>
                          <td className="p-4 whitespace-nowrap font-bold text-slate-200">
                            {s.totalRatings > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>{s.averageRating}</span>
                                <span className="text-[10px] text-slate-500 font-normal">({s.totalRatings} ratings)</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 font-normal">Unrated</span>
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {s.userSubmittedRating !== null ? (
                              <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 rounded-md px-2 py-0.5">
                                {s.userSubmittedRating} Stars
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {ratingLoadingStoreId === s.id ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                <span className="text-[10px] text-slate-500">Submitting...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 group">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleRate(s.id, star)}
                                    title={`Rate ${star} Stars`}
                                    className="p-0.5 hover:scale-125 transition-transform"
                                  >
                                    <Star
                                      className={`w-5 h-5 transition-all ${
                                        s.userSubmittedRating !== null && star <= s.userSubmittedRating
                                          ? 'text-indigo-400 fill-indigo-400/80'
                                          : 'text-slate-600 hover:text-indigo-400/50'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
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

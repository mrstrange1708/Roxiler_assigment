'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  Store,
  Star,
  LogOut,
  Plus,
  Search,
  ArrowUpDown,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  Home as HomeIcon,
  Filter,
  CheckCircle,
  HelpCircle,
  Building
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  address: string;
  role: string;
  averageRating: number | null;
}

interface StoreItem {
  id: string;
  name: string;
  email: string;
  address: string;
  averageRating: number;
  totalRatings: number;
}

export default function AdminDashboard() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if unauthorized
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // Dashboard Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab State: 'listings' | 'add_user' | 'add_store'
  const [activeTab, setActiveTab] = useState<'listings' | 'add_user' | 'add_store'>('listings');
  const [listingTab, setListingTab] = useState<'users' | 'stores'>('users');

  // Listings state
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [storesList, setStoresList] = useState<StoreItem[]>([]);
  const [listsLoading, setListsLoading] = useState(true);

  // Search & Filter state
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterRole, setFilterRole] = useState(''); // Empty means all

  // Sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Create User Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'USER',
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null);

  // Create Store Form State
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    storeEmail: '',
    storeAddress: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerAddress: '',
  });
  const [storeFormErrors, setStoreFormErrors] = useState<Record<string, string>>({});
  const [storeFormSubmitting, setStoreFormSubmitting] = useState(false);
  const [storeFormSuccess, setStoreFormSuccess] = useState<string | null>(null);

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // API fetches
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setListsLoading(true);
      const query = new URLSearchParams({
        name: filterName,
        email: filterEmail,
        address: filterAddress,
        role: filterRole,
        sortBy,
        sortOrder,
      }).toString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setListsLoading(false);
    }
  }, [token, filterName, filterEmail, filterAddress, filterRole, sortBy, sortOrder]);

  const fetchStores = useCallback(async () => {
    if (!token) return;
    try {
      setListsLoading(true);
      const query = new URLSearchParams({
        name: filterName,
        email: filterEmail,
        address: filterAddress,
        sortBy,
        sortOrder,
      }).toString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stores?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStoresList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setListsLoading(false);
    }
  }, [token, filterName, filterEmail, filterAddress, sortBy, sortOrder]);

  // Sync data on filter/sort changes
  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token, fetchStats]);

  useEffect(() => {
    if (token) {
      if (listingTab === 'users') {
        fetchUsers();
      } else {
        fetchStores();
      }
    }
  }, [token, listingTab, fetchUsers, fetchStores]);

  // Handle User Click for details
  const handleUserClick = async (userId: string) => {
    if (!token) return;
    setDetailsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Toggle sort order
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // User form submission
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormErrors({});
    setUserFormSuccess(null);

    // Validation
    const tempErrors: Record<string, string> = {};
    if (userForm.name.trim().length < 20 || userForm.name.trim().length > 60) {
      tempErrors.name = 'Name must be between 20 and 60 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      tempErrors.email = 'Invalid email address.';
    }
    if (userForm.address.trim().length === 0) {
      tempErrors.address = 'Address is required.';
    } else if (userForm.address.trim().length > 400) {
      tempErrors.address = 'Address cannot exceed 400 characters.';
    }
    if (userForm.password.length < 8 || userForm.password.length > 16) {
      tempErrors.password = 'Password must be 8-16 characters.';
    } else {
      const hasUppercase = /[A-Z]/.test(userForm.password);
      const hasSpecial = /[^a-zA-Z0-9]/.test(userForm.password);
      if (!hasUppercase) tempErrors.password = 'Requires 1+ uppercase letter.';
      else if (!hasSpecial) tempErrors.password = 'Requires 1+ special character.';
    }

    if (Object.keys(tempErrors).length > 0) {
      setUserFormErrors(tempErrors);
      return;
    }

    setUserFormSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userForm),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setUserFormErrors(data.errors);
        } else {
          setUserFormErrors({ global: data.error || 'Failed to create user.' });
        }
      } else {
        setUserFormSuccess('User added successfully!');
        setUserForm({ name: '', email: '', password: '', address: '', role: 'USER' });
        fetchStats();
        fetchUsers();
      }
    } catch (err) {
      setUserFormErrors({ global: 'Network error occurred.' });
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Store form submission
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreFormErrors({});
    setStoreFormSuccess(null);

    // Validation
    const tempErrors: Record<string, string> = {};
    if (storeForm.storeName.trim().length < 20 || storeForm.storeName.trim().length > 60) {
      tempErrors.storeName = 'Store name must be between 20 and 60 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(storeForm.storeEmail)) {
      tempErrors.storeEmail = 'Invalid store email address.';
    }
    if (storeForm.storeAddress.trim().length === 0) {
      tempErrors.storeAddress = 'Store address is required.';
    } else if (storeForm.storeAddress.trim().length > 400) {
      tempErrors.storeAddress = 'Store address cannot exceed 400 characters.';
    }

    if (storeForm.ownerName.trim().length < 20 || storeForm.ownerName.trim().length > 60) {
      tempErrors.ownerName = 'Owner name must be between 20 and 60 characters.';
    }
    if (!emailRegex.test(storeForm.ownerEmail)) {
      tempErrors.ownerEmail = 'Invalid owner email address.';
    }
    if (storeForm.ownerAddress.trim().length === 0) {
      tempErrors.ownerAddress = 'Owner address is required.';
    } else if (storeForm.ownerAddress.trim().length > 400) {
      tempErrors.ownerAddress = 'Owner address cannot exceed 400 characters.';
    }
    if (storeForm.ownerPassword.length < 8 || storeForm.ownerPassword.length > 16) {
      tempErrors.ownerPassword = 'Owner password must be 8-16 characters.';
    } else {
      const hasUppercase = /[A-Z]/.test(storeForm.ownerPassword);
      const hasSpecial = /[^a-zA-Z0-9]/.test(storeForm.ownerPassword);
      if (!hasUppercase) tempErrors.ownerPassword = 'Requires 1+ uppercase letter.';
      else if (!hasSpecial) tempErrors.ownerPassword = 'Requires 1+ special character.';
    }

    if (Object.keys(tempErrors).length > 0) {
      setStoreFormErrors(tempErrors);
      return;
    }

    setStoreFormSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storeForm),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setStoreFormErrors(data.errors);
        } else {
          setStoreFormErrors({ global: data.error || 'Failed to create store and owner.' });
        }
      } else {
        setStoreFormSuccess('Store and Owner registered successfully!');
        setStoreForm({
          storeName: '',
          storeEmail: '',
          storeAddress: '',
          ownerName: '',
          ownerEmail: '',
          ownerPassword: '',
          ownerAddress: '',
        });
        fetchStats();
        fetchStores();
      }
    } catch (err) {
      setStoreFormErrors({ global: 'Network error occurred.' });
    } finally {
      setStoreFormSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setFilterName('');
    setFilterEmail('');
    setFilterAddress('');
    setFilterRole('');
  };

  if (authLoading || !user || user.role !== 'ADMIN') {
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
            <h1 className="text-xl font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">System Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-200">{user.name}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-widest">SysAdmin</span>
          </div>
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* Statistics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-750 p-6 rounded-2xl flex items-center gap-5 shadow-lg shadow-indigo-950/5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</p>
              {statsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mt-1.5 text-slate-500" />
              ) : (
                <p className="text-3xl font-extrabold text-white mt-1">{stats.totalUsers}</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-750 p-6 rounded-2xl flex items-center gap-5 shadow-lg shadow-indigo-950/5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Stores</p>
              {statsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mt-1.5 text-slate-500" />
              ) : (
                <p className="text-3xl font-extrabold text-white mt-1">{stats.totalStores}</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-750 p-6 rounded-2xl flex items-center gap-5 shadow-lg shadow-indigo-950/5 transition-all">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ratings Submitted</p>
              {statsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mt-1.5 text-slate-500" />
              ) : (
                <p className="text-3xl font-extrabold text-white mt-1">{stats.totalRatings}</p>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard Tabs bar */}
        <div className="border-b border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-3 text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${activeTab === 'listings' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Browse Lists
            </button>
            <button
              onClick={() => setActiveTab('add_user')}
              className={`py-3 text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${activeTab === 'add_user' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Add User
            </button>
            <button
              onClick={() => setActiveTab('add_store')}
              className={`py-3 text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${activeTab === 'add_store' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Add Store
            </button>
          </div>
        </div>

        {/* --- TAB CONTENT: LISTINGS --- */}
        {activeTab === 'listings' && (
          <section className="space-y-6">
            
            {/* Inner Tabs & Filters grid */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-6 shadow-xl">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                  <button
                    onClick={() => { setListingTab('users'); setSortBy('name'); }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${listingTab === 'users' ? 'bg-indigo-500 text-white shadow shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Users ({usersList.length})
                  </button>
                  <button
                    onClick={() => { setListingTab('stores'); setSortBy('name'); }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${listingTab === 'stores' ? 'bg-indigo-500 text-white shadow shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Stores ({storesList.length})
                  </button>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <Filter className="w-4 h-4 text-indigo-400" />
                  Filter and Sort Listings Below
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Filter by Name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs transition-all"
                      placeholder="Search name..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Filter by Email</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs transition-all"
                      placeholder="Search email..."
                      value={filterEmail}
                      onChange={(e) => setFilterEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Filter by Address</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs transition-all"
                      placeholder="Search address..."
                      value={filterAddress}
                      onChange={(e) => setFilterAddress(e.target.value)}
                    />
                  </div>
                </div>

                {listingTab === 'users' ? (
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Role Type</label>
                    <select
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 rounded-xl py-2 px-3 text-xs transition-all"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="USER">USER</option>
                      <option value="STORE_OWNER">STORE OWNER</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <button
                      onClick={handleResetFilters}
                      className="w-full bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl py-2 text-xs font-semibold border border-slate-800 active:scale-[0.98] transition-all"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {listingTab === 'users' && (
                <div className="flex justify-end -mt-2">
                  <button onClick={handleResetFilters} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                    Reset all filters
                  </button>
                </div>
              )}
            </div>

            {/* List Display Container */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
              {listsLoading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-slate-400 text-xs">Loading listings data...</span>
                </div>
              ) : listingTab === 'users' ? (
                /* --- USERS TABLE --- */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase font-bold tracking-wider">
                        <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                        <th onClick={() => handleSort('email')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Email <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                        <th onClick={() => handleSort('address')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Address <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                        <th onClick={() => handleSort('role')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Role <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                        <th onClick={() => handleSort('rating')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Store Rating <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-12 text-slate-500">
                            No users found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr
                            key={u.id}
                            onClick={() => handleUserClick(u.id)}
                            className="hover:bg-slate-900/20 cursor-pointer transition-colors"
                          >
                            <td className="p-4 font-bold text-slate-200 whitespace-nowrap">{u.name}</td>
                            <td className="p-4 text-slate-300 font-mono">{u.email}</td>
                            <td className="p-4 text-slate-400 max-w-xs truncate">{u.address}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : u.role === 'STORE_OWNER' ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' : 'bg-slate-850 text-slate-400 border-slate-700'}`}
                              >
                                {u.role === 'STORE_OWNER' ? 'STORE OWNER' : u.role}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-200">
                              {u.role === 'STORE_OWNER' ? (
                                u.averageRating !== null ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span>{u.averageRating}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-500">No Store</span>
                                )
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* --- STORES TABLE --- */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 uppercase font-bold tracking-wider">
                        <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Store Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                        <th onClick={() => handleSort('email')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Store Email <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                        <th onClick={() => handleSort('address')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Store Address <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                        <th onClick={() => handleSort('rating')} className="p-4 cursor-pointer hover:bg-slate-900/60 hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">
                            Overall Rating <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {storesList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center p-12 text-slate-500">
                            No stores found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        storesList.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="p-4 font-bold text-slate-200 whitespace-nowrap">{s.name}</td>
                            <td className="p-4 text-slate-300 font-mono">{s.email}</td>
                            <td className="p-4 text-slate-400 max-w-xs truncate">{s.address}</td>
                            <td className="p-4 whitespace-nowrap font-bold text-slate-200">
                              {s.totalRatings > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  <span>{s.averageRating}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">({s.totalRatings} rates)</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-normal">Unrated</span>
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
        )}

        {/* --- TAB CONTENT: ADD USER --- */}
        {activeTab === 'add_user' && (
          <section className="max-w-xl mx-auto bg-slate-900/40 border border-slate-850 p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Add New User
            </h2>
            <p className="text-slate-400 text-xs mb-6">Register a system administrator or normal user account directly.</p>

            {userFormSuccess && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                {userFormSuccess}
              </div>
            )}

            {userFormErrors.global && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
                {userFormErrors.global}
              </div>
            )}

            <form onSubmit={handleUserSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-350 text-[10px] font-bold uppercase mb-1">User Role</label>
                  <select
                    className="w-full bg-slate-950/60 border border-slate-800 outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs focus:border-indigo-500 transition-all"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="USER">USER (Normal)</option>
                    <option value="ADMIN">ADMIN (System Administrator)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="block text-slate-300 text-[10px] font-bold uppercase">Full Name</label>
                  <span className="text-[9px] text-slate-500">20-60 Characters</span>
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    className={`w-full bg-slate-950/60 border ${userFormErrors.name ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs transition-all`}
                    placeholder="Enter user's name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                {userFormErrors.name && <p className="mt-1 text-[10px] text-red-400 font-medium">{userFormErrors.name}</p>}
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    className={`w-full bg-slate-950/60 border ${userFormErrors.email ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs transition-all`}
                    placeholder="user@example.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
                {userFormErrors.email && <p className="mt-1 text-[10px] text-red-400 font-medium">{userFormErrors.email}</p>}
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="block text-slate-300 text-[10px] font-bold uppercase">Address</label>
                  <span className="text-[9px] text-slate-500">Max 400 Characters</span>
                </div>
                <div className="relative">
                  <HomeIcon className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
                  <textarea
                    required
                    rows={3}
                    className={`w-full bg-slate-950/60 border ${userFormErrors.address ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs transition-all resize-none`}
                    placeholder="Enter user's address..."
                    value={userForm.address}
                    onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  />
                </div>
                {userFormErrors.address && <p className="mt-1 text-[10px] text-red-400 font-medium">{userFormErrors.address}</p>}
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="block text-slate-300 text-[10px] font-bold uppercase">Initial Password</label>
                  <span className="text-[9px] text-slate-500">8-16 chars, 1 uppercase, 1 special</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    className={`w-full bg-slate-950/60 border ${userFormErrors.password ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs transition-all`}
                    placeholder="••••••••"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
                {userFormErrors.password && <p className="mt-1 text-[10px] text-red-400 font-medium">{userFormErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={userFormSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-2.5 text-xs font-semibold tracking-wide shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {userFormSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Creating User...
                  </>
                ) : (
                  'Add User'
                )}
              </button>
            </form>
          </section>
        )}

        {/* --- TAB CONTENT: ADD STORE --- */}
        {activeTab === 'add_store' && (
          <section className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-850 p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Register Store & Owner
            </h2>
            <p className="text-slate-400 text-xs mb-6">Register a new store entity alongside its associated Store Owner account in a single transaction.</p>

            {storeFormSuccess && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                {storeFormSuccess}
              </div>
            )}

            {storeFormErrors.global && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
                {storeFormErrors.global}
              </div>
            )}

            <form onSubmit={handleStoreSubmit} className="space-y-6">
              
              {/* SECTION A: STORE DETAILS */}
              <div className="border-b border-slate-800 pb-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Building className="w-4 h-4" /> Store Information
                </h3>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-slate-300 text-[10px] font-bold uppercase">Store Name</label>
                    <span className="text-[9px] text-slate-500">20-60 Characters</span>
                  </div>
                  <input
                    type="text"
                    required
                    className={`w-full bg-slate-950/60 border ${storeFormErrors.storeName ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs transition-all`}
                    placeholder="Enter store's full business name"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                  />
                  {storeFormErrors.storeName && <p className="mt-1 text-[10px] text-red-400 font-medium">{storeFormErrors.storeName}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">Store Contact Email</label>
                  <input
                    type="email"
                    required
                    className={`w-full bg-slate-950/60 border ${storeFormErrors.storeEmail ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs transition-all`}
                    placeholder="contact@store-email.com"
                    value={storeForm.storeEmail}
                    onChange={(e) => setStoreForm({ ...storeForm, storeEmail: e.target.value })}
                  />
                  {storeFormErrors.storeEmail && <p className="mt-1 text-[10px] text-red-400 font-medium">{storeFormErrors.storeEmail}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-slate-300 text-[10px] font-bold uppercase">Store Address</label>
                    <span className="text-[9px] text-slate-500">Max 400 Characters</span>
                  </div>
                  <textarea
                    required
                    rows={2}
                    className={`w-full bg-slate-950/60 border ${storeFormErrors.storeAddress ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs transition-all resize-none`}
                    placeholder="Enter store location details..."
                    value={storeForm.storeAddress}
                    onChange={(e) => setStoreForm({ ...storeForm, storeAddress: e.target.value })}
                  />
                  {storeFormErrors.storeAddress && <p className="mt-1 text-[10px] text-red-400 font-medium">{storeFormErrors.storeAddress}</p>}
                </div>
              </div>

              {/* SECTION B: OWNER DETAILS */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4" /> Owner Account Information
                </h3>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-slate-300 text-[10px] font-bold uppercase">Owner Name</label>
                    <span className="text-[9px] text-slate-500">20-60 Characters</span>
                  </div>
                  <input
                    type="text"
                    required
                    className={`w-full bg-slate-950/60 border ${storeFormErrors.ownerName ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs transition-all`}
                    placeholder="Owner's full legal name"
                    value={storeForm.ownerName}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                  />
                  {storeFormErrors.ownerName && <p className="mt-1 text-[10px] text-red-400 font-medium">{storeFormErrors.ownerName}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">Owner Email Address</label>
                  <input
                    type="email"
                    required
                    className={`w-full bg-slate-950/60 border ${storeFormErrors.ownerEmail ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs transition-all`}
                    placeholder="owner@example.com"
                    value={storeForm.ownerEmail}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerEmail: e.target.value })}
                  />
                  {storeFormErrors.ownerEmail && <p className="mt-1 text-[10px] text-red-400 font-medium">{storeFormErrors.ownerEmail}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-slate-300 text-[10px] font-bold uppercase">Owner Address</label>
                    <span className="text-[9px] text-slate-500">Max 400 Characters</span>
                  </div>
                  <textarea
                    required
                    rows={2}
                    className={`w-full bg-slate-950/60 border ${storeFormErrors.ownerAddress ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs transition-all resize-none`}
                    placeholder="Owner's residential address..."
                    value={storeForm.ownerAddress}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerAddress: e.target.value })}
                  />
                  {storeFormErrors.ownerAddress && <p className="mt-1 text-[10px] text-red-400 font-medium">{storeFormErrors.ownerAddress}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-slate-300 text-[10px] font-bold uppercase">Owner Password</label>
                    <span className="text-[9px] text-slate-500">8-16 chars, 1 uppercase, 1 special</span>
                  </div>
                  <input
                    type="password"
                    required
                    className={`w-full bg-slate-950/60 border ${storeFormErrors.ownerPassword ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'} outline-none text-slate-100 rounded-xl py-2.5 px-3 text-xs transition-all`}
                    placeholder="••••••••"
                    value={storeForm.ownerPassword}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerPassword: e.target.value })}
                  />
                  {storeFormErrors.ownerPassword && <p className="mt-1 text-[10px] text-red-400 font-medium">{storeFormErrors.ownerPassword}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={storeFormSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-2.5 text-xs font-semibold tracking-wide shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {storeFormSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Registering Store & Owner...
                  </>
                ) : (
                  'Register Store & Owner'
                )}
              </button>
            </form>
          </section>
        )}

      </main>

      {/* --- DETAILED VIEW MODAL --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-6 border-b border-slate-850 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">User Details</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold border border-slate-850 hover:bg-slate-900 px-2.5 py-1 rounded-md"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Full Name</span>
                <p className="text-slate-200 font-semibold text-sm">{selectedUser.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email Address</span>
                <p className="text-slate-300 font-mono">{selectedUser.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Residential Address</span>
                <p className="text-slate-300 leading-relaxed">{selectedUser.address}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">System Role</span>
                <div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${selectedUser.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : selectedUser.role === 'STORE_OWNER' ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' : 'bg-slate-850 text-slate-400 border-slate-700'}`}
                  >
                    {selectedUser.role === 'STORE_OWNER' ? 'STORE OWNER' : selectedUser.role}
                  </span>
                </div>
              </div>

              {selectedUser.role === 'STORE_OWNER' && (
                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2 mt-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Linked Business Store</span>
                  {selectedUser.store ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">Store Name</span>
                        <p className="text-slate-200 font-bold">{selectedUser.store.name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">Store Address</span>
                        <p className="text-slate-400">{selectedUser.store.address}</p>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">Overall Rating</span>
                        <div className="flex items-center gap-1 font-bold text-slate-200 text-sm">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>{selectedUser.averageRating ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-red-400 italic">No store has been configured for this owner yet.</span>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

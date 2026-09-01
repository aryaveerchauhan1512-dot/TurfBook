import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Store,
  DollarSign,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  Calendar
} from 'lucide-react';
import { User, AdminStats, Turf } from '../types';

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [turfsList, setTurfsList] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'turfs' | 'analytics'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, turfsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/turfs'),
      ]);

      const statsData = statsRes.ok ? await statsRes.json().catch(() => null) : null;
      const usersData = usersRes.ok ? await usersRes.json().catch(() => []) : [];
      const turfsData = turfsRes.ok ? await turfsRes.json().catch(() => []) : [];

      setStats(statsData);
      setUsersList(usersData);
      setTurfsList(turfsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Ban / Unban User or Owner
  const handleToggleBan = async (targetUserId: string, currentBanned: boolean) => {
    try {
      await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, isBanned: !currentBanned }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Error toggling ban:', err);
    }
  };

  // Verify Owner
  const handleToggleVerifyOwner = async (ownerId: string, currentVerified: boolean) => {
    try {
      await fetch('/api/admin/verify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, isVerified: !currentVerified }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Error verifying owner:', err);
    }
  };

  // Delete / Unpost Listing
  const handleAdminDeleteTurf = async (turfId: string) => {
    if (!confirm('Admin Command: Are you sure you want to unpost/remove this turf listing?')) return;
    try {
      await fetch('/api/admin/delete-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turfId }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Error removing listing:', err);
    }
  };

  // Delete User Account Permanently
  const handlePermanentDeleteUser = async (targetUserId: string, targetUserName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete account "${targetUserName}"? This action cannot be undone.`)) return;
    try {
      await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Error deleting user account:', err);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.businessName && u.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide">Super Admin Command Center</h2>
              <p className="text-xs text-slate-400">
                Logged in as <code className="text-amber-400 font-mono">Admin@1o1</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Stats Metrics Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100 border-b border-slate-200 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Players</span>
              <p className="text-lg font-black text-slate-800">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Turf Owners</span>
              <p className="text-lg font-black text-[#2E7D32]">{stats.totalOwners}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Turfs</span>
              <p className="text-lg font-black text-slate-800">{stats.totalTurfs}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">System Revenue</span>
              <p className="text-lg font-black text-[#2E7D32]">₹{stats.totalRevenue}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="px-6 pt-3 bg-white border-b border-slate-100 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Manage Accounts ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('turfs')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'turfs'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Moderate Listings ({turfsList.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter users or owners by name, email, or role..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">User / Business</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Joined Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                          {u.businessName && (
                            <p className="text-[10px] text-emerald-700 font-bold">{u.businessName}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : u.role === 'owner'
                                ? 'bg-emerald-100 text-[#2E7D32]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.role === 'user' ? 'Player' : u.role}
                          </span>
                        </td>
                        <td className="p-3">{u.phone || 'N/A'}</td>
                        <td className="p-3 text-[10px] text-slate-500 font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Earlier'}
                        </td>
                        <td className="p-3">
                          {u.isBanned ? (
                            <span className="text-rose-600 font-bold text-[10px] uppercase">Suspended / Banned</span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[10px] uppercase">Active</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          {u.role === 'owner' && (
                            <button
                              onClick={() => handleToggleVerifyOwner(u.id, u.isVerified)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                                u.isVerified
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              {u.isVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                          )}

                          {u.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => handleToggleBan(u.id, u.isBanned)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                                  u.isBanned
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                }`}
                              >
                                {u.isBanned ? 'Restore' : 'Ban'}
                              </button>
                              <button
                                onClick={() => handlePermanentDeleteUser(u.id, u.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                                title="Delete Account Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'turfs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {turfsList.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white flex items-start justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={t.images[0]}
                      alt=""
                      className="w-20 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1">{t.name}</h4>
                      <p className="text-[10px] text-slate-400">{t.address}, {t.city}</p>
                      <p className="text-[11px] font-bold text-[#2E7D32] mt-1">₹{t.pricePerHour}/hr • Owner: {t.ownerName}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdminDeleteTurf(t.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                    title="Unpost/Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

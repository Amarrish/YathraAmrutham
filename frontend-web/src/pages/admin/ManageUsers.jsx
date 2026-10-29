import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Users, KeyRound, Search, CheckCircle, AlertTriangle,
  X, Lock, Trash2, Edit3
} from 'lucide-react';

export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Reset password modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Edit user modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', role: 'user' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // ── Reset password ──────────────────────────────────────────
  const openReset = (u) => { setSelectedUser(u); setNewPassword(''); setConfirmPassword(''); setResetError(''); setResetModalOpen(true); };
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < 6) { setResetError('Min 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match.'); return; }
    setResetLoading(true);
    try {
      const res = await api.put(`/admin/users/${selectedUser._id}/reset-password`, { newPassword });
      if (res.data.success) { setMessage(res.data.message); setResetModalOpen(false); }
    } catch (err) { setResetError(err.response?.data?.message || 'Error.'); }
    finally { setResetLoading(false); }
  };

  // ── Edit user ───────────────────────────────────────────────
  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({ name: u.name || '', phone: u.phone || '', address: u.address || '', role: u.role || 'user' });
    setEditError('');
    setEditModalOpen(true);
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editForm.name.trim()) { setEditError('Name is required.'); return; }
    setEditLoading(true);
    try {
      const res = await api.put(`/admin/users/${editTarget._id}`, editForm);
      if (res.data.success) {
        setMessage(`User "${editForm.name}" updated successfully.`);
        setEditModalOpen(false);
        setUsers((prev) => prev.map((u) => u._id === editTarget._id ? { ...u, ...editForm } : u));
      }
    } catch (err) { setEditError(err.response?.data?.message || 'Error.'); }
    finally { setEditLoading(false); }
  };

  // ── Delete user ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/admin/users/${deleteTarget._id}`);
      if (res.data.success) {
        setMessage(res.data.message);
        setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Delete failed.');
      setDeleteTarget(null);
    } finally { setDeleteLoading(false); }
  };

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone || '').toLowerCase().includes(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-1">Edit profiles, reset passwords, or remove users</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text" placeholder="Search by name, email, phone..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold">
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /><span>{message}</span></div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}
      {globalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-semibold">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /><span>{globalError}</span></div>
          <button onClick={() => setGlobalError('')} className="text-rose-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Bookings</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">No users found.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">{u.name.charAt(0)}</div>
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{u.name}</span>
                        <span className="text-slate-500 text-[11px]">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-sky-100 text-sky-800 border border-sky-200'}`}>{u.role}</span>
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5 text-slate-600">
                    <div>{u.phone || '—'}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{u.address || '—'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{u.bookingsCount || 0} trip(s)</td>
                  <td className="py-3.5 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg border border-sky-200 transition-colors">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => openReset(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-lg border border-amber-200 transition-colors">
                        <KeyRound className="w-3 h-3" /> Reset
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─ Edit User Modal ────────────────────────────────────── */}
      {editModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-sky-600 px-6 py-4 text-white font-black flex items-center justify-between">
              <div className="flex items-center gap-2"><Edit3 className="w-5 h-5" /><h3>Edit User Profile</h3></div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg hover:bg-sky-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500">Editing:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{editTarget.name}</p>
                <p className="text-slate-600">{editTarget.email}</p>
              </div>
              {editError && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">{editError}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="City, State"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none">
                  <option value="user">User (Customer)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={editLoading} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md disabled:bg-slate-300">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─ Reset Password Modal ───────────────────────────────── */}
      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-amber-500 px-6 py-4 text-slate-950 font-black flex items-center justify-between">
              <div className="flex items-center gap-2"><KeyRound className="w-5 h-5" /><h3>Admin Password Reset</h3></div>
              <button onClick={() => setResetModalOpen(false)} className="p-1 rounded-lg hover:bg-amber-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500">Resetting for:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedUser.name}</p>
                <p className="text-slate-600">{selectedUser.email}</p>
              </div>
              {resetError && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">{resetError}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setResetModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800">Cancel</button>
                <button type="submit" disabled={resetLoading} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md disabled:bg-slate-300">
                  {resetLoading ? 'Resetting...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─ Delete Confirm ─────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-rose-600 px-6 py-4 text-white font-black flex items-center gap-2">
              <Trash2 className="w-5 h-5" /><h3>Confirm Removal</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                <p className="font-bold text-rose-900 text-sm">{deleteTarget.name}</p>
                <p className="text-rose-700">{deleteTarget.email}</p>
                <p className="text-rose-600">{deleteTarget.bookingsCount || 0} booking(s) will be cancelled</p>
              </div>
              <p className="text-xs text-slate-600"><strong>⚠️ This cannot be undone.</strong> All bookings will be cancelled and confirmed seats released back to the tour.</p>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800">Cancel</button>
                <button onClick={handleDelete} disabled={deleteLoading} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md disabled:bg-slate-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleteLoading ? 'Removing...' : 'Yes, Remove User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

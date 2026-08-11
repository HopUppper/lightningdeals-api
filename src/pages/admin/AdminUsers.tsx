import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, UserCheck, UserX, Key, Search } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await adminFetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setName('');
        setEmail('');
        setPassword('');
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminFetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const formatTokens = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val?.toLocaleString() || '0';
  };

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">User Management</h1>
          <p className="text-xs text-muted mt-1">
            View registered user accounts, manage statuses, and grant key permissions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="ui-button-primary text-xs py-2 px-4 gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
        />
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Keys</th>
                  <th className="py-3 px-4">Requests</th>
                  <th className="py-3 px-4">Tokens Used</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-fg">{u.name}</p>
                      <p className="font-mono text-[11px] text-muted">{u.email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        u.role === 'admin' ? 'bg-violet-600/10 text-violet-600' : 'bg-muted/40 text-muted'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-fg">{u.keyCount}</td>
                    <td className="py-3 px-4 font-mono text-fg">{u.requestCount}</td>
                    <td className="py-3 px-4 font-mono text-fg">{formatTokens(u.tokensUsed)}</td>
                    <td className="py-3 px-4 font-mono text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold border border-border bg-bg hover:bg-card text-fg"
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Creating User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-fg">Add New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Developer"
                  className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@enterprise.com"
                  className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="ui-button-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="ui-button-primary text-xs py-2 px-4 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

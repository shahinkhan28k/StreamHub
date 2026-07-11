import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { User, Shield, ShieldAlert, ShieldCheck, Mail, Calendar, Search, MoreVertical, Check, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminSidebar from '../../components/AdminSidebar';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingRole, setEditingRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: 'user' | 'moderator' | 'admin') => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      setEditingRole(null);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role.");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'moderator': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'moderator': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-neutral-800 text-neutral-400 border-white/5';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Elegant Sidebar */}
        <AdminSidebar />

        {/* Content Area */}
        <div className="flex-1 w-full space-y-6">
          {/* Back Button */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-full text-xs font-bold text-neutral-300 hover:text-white transition-all shadow-xl"
            >
              <ChevronLeft className="w-4 h-4 text-rose-500" />
              <span>ফিরে যান (Go Back)</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-neutral-400 mt-1">Manage user permissions and security roles</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-900 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-rose-500 transition-colors w-64 text-white"
                />
              </div>
              
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-neutral-900 border border-white/10 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-rose-500 transition-colors text-neutral-300"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Joined</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-neutral-900" />
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-neutral-600" />
                          )}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      {editingRole === u.uid ? (
                        <div className="flex items-center gap-2">
                          <select 
                            defaultValue={u.role}
                            id={`role-select-${u.uid}`}
                            className="bg-neutral-800 border border-white/10 rounded-lg py-1 px-2 text-xs"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button 
                            onClick={() => {
                              const select = document.getElementById(`role-select-${u.uid}`) as HTMLSelectElement;
                              updateUserRole(u.uid, select.value as any);
                            }}
                            className="p-1 hover:bg-green-500/20 text-green-500 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingRole(null)}
                            className="p-1 hover:bg-rose-500/20 text-rose-500 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(u.role)}`}>
                          {getRoleIcon(u.role)}
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setEditingRole(u.uid)}
                        className="p-2 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}

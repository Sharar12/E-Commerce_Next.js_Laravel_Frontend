"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";
import { Search, Filter, ArrowUpDown } from "lucide-react";

interface User {
  id: number;
  user_code?: string;
  name: string;
  email: string;
  role: "admin" | "customer" | string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc" | "email_asc">("newest");

  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchUsers = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/users`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result.data)) {
        setUsers(result.data);
      } else if (Array.isArray(result)) {
        setUsers(result);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const getUserDisplayCode = (u: User) => {
    if (u.user_code) return u.user_code;
    return String(10000000 + (u.id * 148927) % 90000000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user account?")) return;
    try {
      const res = await fetch(`${apiUrl}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert("❌ Error deleting user: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user account!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ name: editUser.name, email: editUser.email, role: editUser.role }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...(result.data || editUser) } : u)));
        setEditUser(null);
      } else {
        alert("❌ Error updating user: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating user:", error);
      alert("Error updating user!");
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Filter & Sort Logic
  const filteredAndSortedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = users.filter((u) => {
      const codeStr = getUserDisplayCode(u).toLowerCase();
      const rawIdStr = u.id.toString();
      const nameStr = u.name.toLowerCase();
      const emailStr = u.email.toLowerCase();
      const roleStr = u.role.toLowerCase();

      const matchSearch =
        !q ||
        codeStr.includes(q) ||
        rawIdStr.includes(q) ||
        nameStr.includes(q) ||
        emailStr.includes(q) ||
        roleStr.includes(q);

      const matchRole = roleFilter === "all" || roleStr === roleFilter.toLowerCase();

      return matchSearch && matchRole;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "email_asc") {
        return a.email.localeCompare(b.email);
      }
      return 0;
    });
  }, [users, search, roleFilter, sortBy]);

  const paginatedUsers = useMemo(() => {
    return filteredAndSortedUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredAndSortedUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, sortBy]);

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">User Directory & Access Control</span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">Registered Accounts</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search code, name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 md:w-64 pl-9 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-[#9E988D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D5] px-3 py-2 rounded-xl text-xs shadow-sm">
              <Filter className="w-3.5 h-3.5 text-[#8C6D2B]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-[#1C1A17] text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D5] px-3 py-2 rounded-xl text-xs shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8C6D2B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#1C1A17] text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="name_desc">Sort: Name (Z-A)</option>
                <option value="email_asc">Sort: Email (A-Z)</option>
              </select>
            </div>

            <Link href="/admin/users/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl">
              + Add User
            </Link>
          </div>
        </div>

        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading User Directory...</p>
          </div>
        ) : filteredAndSortedUsers.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedUsers.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="users"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">User Code</th>
                    <th className="px-6 py-4">Patron Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#FFFDF9] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">
                        <span className="bg-[#FAF8F5] px-2 py-1 rounded border border-[#E8E2D5]">
                          {getUserDisplayCode(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-serif font-semibold text-[#1C1A17]">{user.name}</td>
                      <td className="px-6 py-4 font-mono text-[#5A554C]">{user.email}</td>
                      <td className="px-6 py-4">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]">Administrator</span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-700">Customer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewUser(user)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="View Account">👁</button>
                          <button onClick={() => setEditUser(user)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="Edit Account">✏️</button>
                          <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" title="Delete Account">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredAndSortedUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No registered accounts found.</p>
          </div>
        )}

        {/* View Modal */}
        {viewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Account Profile</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">{viewUser.name}</h3>
                </div>
                <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["User Code", getUserDisplayCode(viewUser)],
                  ["Database ID", `#${viewUser.id}`],
                  ["Full Name", viewUser.name],
                  ["Email", viewUser.email],
                  ["Role", viewUser.role],
                  ["Joined", fmtDate(viewUser.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-[#5A554C]">{label}</span>
                    <span className="font-semibold text-[#1C1A17] text-right font-mono">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewUser(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Account</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">{getUserDisplayCode(editUser)}</h3>
                </div>
                <button onClick={() => setEditUser(null)} className="text-[#gray-400] hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Full Name</label>
                  <input type="text" required value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Email Address</label>
                  <input type="email" required value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Role</label>
                  <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]">
                    <option value="customer">Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
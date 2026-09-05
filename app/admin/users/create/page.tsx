"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, adminToken } from "../../../common/http";
import AdminLayout from "../../AdminLayout";
import Link from "next/link";
import { ArrowLeft, UserPlus, Shield, Mail, Lock, User as UserIcon } from "lucide-react";

export default function CreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "admin">("customer");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const result = await res.json();
      setSaving(false);

      if (res.ok && (result.status === 201 || result.status === 200 || result.data)) {
        router.push("/admin/users");
      } else {
        setErrorMsg(result.message || "Failed to create user account.");
      }
    } catch (err: any) {
      setSaving(false);
      console.error("Error creating user:", err);
      setErrorMsg("An unexpected error occurred while saving the account.");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Account Registration
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight flex items-center gap-2">
              <UserPlus className="w-7 h-7 text-[#8C6D2B]" /> Create New Account
            </h1>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8E2D5] bg-white hover:bg-[#FAF8F5] text-[#1C1A17] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </Link>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            ❌ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-[#E8E2D5] shadow-xl space-y-6">
          <div className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Eleanor Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#1C1A17] focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. eleanor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#1C1A17] focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Account Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#1C1A17] focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Account Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "customer" | "admin")}
                className="w-full p-3.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#1C1A17] focus:bg-white transition-all shadow-inner"
              >
                <option value="customer">Customer Account</option>
                <option value="admin">Administrator Account</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#E8E2D5]">
            <Link
              href="/admin/users"
              className="px-5 py-3 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {saving ? "Creating Account..." : "Create User Account"}
            </button>
          </div>
        </form>

      </div>
    </AdminLayout>
  );
}

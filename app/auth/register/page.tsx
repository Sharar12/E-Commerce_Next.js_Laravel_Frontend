"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/app/common/http";
import { Crown, Mail, Lock, User, ShieldCheck, ArrowRight, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";

import Layout from "@/app/components/Layouts";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      if (token) {
        router.push("/");
      }
    }
  }, [router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.status === 200) {
        localStorage.removeItem("patron_orders");
        localStorage.removeItem("checkout_draft");
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data));
        router.push("/");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F5] to-[#F5EFE4] relative overflow-hidden px-4 py-12 selection:bg-[#C5A059] selection:text-white font-sans antialiased">
        {/* Background Ambient Halo Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#E2D4B9]/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Decorative Filigree Corner Lines */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-[#C5A059]/40 hidden md:block" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-[#C5A059]/40 hidden md:block" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-[#C5A059]/40 hidden md:block" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-[#C5A059]/40 hidden md:block" />

        {/* Main Glassmorphic Card Container */}
        <div className="relative w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-3xl border border-[#E8E2D5] shadow-[0_20px_60px_-15px_rgba(28,26,23,0.08)] p-8 md:p-10 transition-all duration-300">
          
          {/* Brand Header & Insignia */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C1A17] to-[#2D2A26] border border-[#C5A059]/40 shadow-xl mb-4 group cursor-pointer">
              <Crown className="w-7 h-7 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#1C1A17] tracking-tight font-medium mb-1">
              Create Account
            </h1>
            <p className="text-xs text-[#7A7468] tracking-widest uppercase font-mono font-medium">
              Join the Maison Privilege Ledger
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 backdrop-blur-md flex items-start gap-3 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full bg-[#FAF8F5]/80 border border-[#E8E2D5] rounded-xl pl-10 pr-4 py-3 text-xs text-[#1C1A17] placeholder-[#7A7468]/60 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@maison.com"
                  className="w-full bg-[#FAF8F5]/80 border border-[#E8E2D5] rounded-xl pl-10 pr-4 py-3 text-xs text-[#1C1A17] placeholder-[#7A7468]/60 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#FAF8F5]/80 border border-[#E8E2D5] rounded-xl pl-10 pr-4 py-3 text-xs text-[#1C1A17] placeholder-[#7A7468]/60 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-mono"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#FAF8F5]/80 border border-[#E8E2D5] rounded-xl pl-10 pr-4 py-3 text-xs text-[#1C1A17] placeholder-[#7A7468]/60 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#1C1A17] to-[#2D2A26] hover:from-[#C5A059] hover:to-[#B8860B] text-white font-semibold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  Creating Patron Account...
                </span>
              ) : (
                <>
                  <span>Register Account</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-[#E8E2D5]/80 text-center">
            <p className="text-xs text-[#7A7468]">
              Already registered?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-[#8C6D2B] hover:text-[#1C1A17] underline decoration-[#C5A059]/40 underline-offset-4 transition-colors"
              >
                Sign In to Your Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

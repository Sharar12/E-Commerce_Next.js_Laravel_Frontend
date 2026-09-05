"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/app/common/http";
import { Crown, Mail, Lock, ShieldCheck, ArrowRight, Sparkles, AlertCircle, ShoppingBag, UserCog } from "lucide-react";

import Layout from "@/app/components/Layouts";

import { useAdminLoginMutation } from "@/app/services/authApi";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [adminLogin] = useAdminLoginMutation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      if (token) {
        const storedUser = localStorage.getItem("adminUser");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user.role === "admin") {
              router.push("/admin/dashboard");
            } else {
              router.push("/");
            }
            return;
          } catch {}
        }
        router.push("/");
      }
    }
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await adminLogin({ email, password }).unwrap();

      if (data.status === 200) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data));

        if (data.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      setError(err?.data?.message || "Unable to connect to the server. Please check your connection.");
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

        {/* Main Glassmorphic Card */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-[#D4AF37]/40 shadow-2xl p-8 sm:p-10 relative z-10">

          {/* Header Badge & Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Crown className="w-7 h-7 text-[#8C6D2B]" />
            </div>

            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B] block mb-1">
              Maison Portal
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-xs text-[#5A554C] font-light leading-relaxed">
              Sign in to your account. Your role determines your destination.
            </p>
          </div>

          {/* Role Indicator Chips */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1A17]/5 border border-[#E8E2D5] text-[10px] font-bold uppercase tracking-wider text-[#5A554C]">
              <ShoppingBag className="w-3 h-3" />
              <span>Customer</span>
            </div>
            <div className="text-[#8C6D2B] text-xs">|</div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1A17]/5 border border-[#E8E2D5] text-[10px] font-bold uppercase tracking-wider text-[#5A554C]">
              <UserCog className="w-3 h-3" />
              <span>Admin</span>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 bg-[#FFF9EE] border border-[#C5A059]/40 text-[#8C6D2B] p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] focus:ring-1 focus:ring-[#1C1A17] transition-all shadow-inner"
                  required
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] focus:ring-1 focus:ring-[#1C1A17] transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#D4AF37] animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </form>

          {/* Quick Test Accounts */}
          <div className="mt-8 pt-6 border-t border-[#E8E2D5]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#8C6D2B] text-center mb-3">
              Quick Access — Test Accounts
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setEmail("admin@gmail.com"); setPassword("11111111"); }}
                className="px-3 py-2.5 bg-[#1C1A17]/5 border border-[#E8E2D5] hover:border-[#C5A059] rounded-xl text-center transition-all group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] group-hover:text-[#1C1A17] block">Admin</span>
                <span className="text-[9px] text-[#5A554C] block mt-0.5">admin@gmail.com</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail("A@gmail.com"); setPassword("11111111"); }}
                className="px-3 py-2.5 bg-[#1C1A17]/5 border border-[#E8E2D5] hover:border-[#C5A059] rounded-xl text-center transition-all group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] group-hover:text-[#1C1A17] block">Customer</span>
                <span className="text-[9px] text-[#5A554C] block mt-0.5">A@gmail.com</span>
              </button>
            </div>
          </div>

          {/* Register link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-[#7A7468]">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-bold text-[#8C6D2B] hover:text-[#1C1A17] underline decoration-[#C5A059]/40 underline-offset-4 transition-colors"
              >
                Create a Patron Account
              </Link>
            </p>
          </div>

          {/* Security Footer */}
          <div className="mt-6 pt-4 border-t border-[#E8E2D5] text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] text-[#7A7468] uppercase tracking-widest font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Encrypted 256-Bit Maison Protocol</span>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, User, Search, Crown, Sparkles, ShieldCheck, ArrowRight, LogOut, Package, UserCircle, ChevronDown } from "lucide-react";
import { useCart } from "../contexts/CartContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { getCartItemsCount } = useCart();

  // Read logged-in user from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("adminUser");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } catch {}
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setUser(null);
    setProfileOpen(false);
    router.push("/");
  };

  // Get user initial for avatar
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "Best Sellers", href: "/best-sellers" },
    { name: "Sale", href: "/sale" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white">

      {/* ==================== 1. GLOBAL LUXURY HEADER ==================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E8E2D5] shadow-sm transition-all duration-300">

        {/* Main Header Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center shadow-sm group-hover:border-[#C5A059] transition-colors">
                <Crown className="w-4 h-4 text-[#8C6D2B]" />
              </div>
              <span className="text-2xl font-serif tracking-widest text-[#1C1A17] font-bold uppercase">
                Maison
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A554C] hover:text-[#C5A059] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#C5A059] hover:after:w-full after:transition-all after:duration-300"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Header Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">

              {/* Integrated Search Input */}
              <div className="hidden sm:flex items-center bg-[#FAF8F5] border border-[#E8E2D5] rounded-full px-3 py-1.5 focus-within:border-[#1C1A17] transition-all shadow-inner">
                <Search className="h-3.5 w-3.5 text-[#8C6D2B]" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  className="bg-transparent border-none focus:outline-none focus:ring-0 px-2 text-xs w-32 lg:w-40 text-[#1C1A17] placeholder-[#9E988D]"
                />
              </div>

              {/* User Profile / Login — Dynamic Avatar + Hover Dropdown */}
              <div className="relative" ref={profileRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      onMouseEnter={() => setProfileOpen(true)}
                      className="flex items-center gap-2 p-1.5 hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8E2D5] rounded-full transition-all duration-200 group"
                      title={`${user.name} (${user.role})`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1C1A17] flex items-center justify-center text-[#D4AF37] text-xs font-bold font-mono shadow-sm group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                        {userInitial}
                      </div>
                      <ChevronDown className={`w-3 h-3 text-[#8C6D2B] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Hover / Click Dropdown Menu */}
                    {profileOpen && (
                      <div
                        onMouseLeave={() => setProfileOpen(false)}
                        className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl border border-[#E8E2D5] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-[#E8E2D5]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1C1A17] flex items-center justify-center text-[#D4AF37] text-sm font-bold font-mono">
                              {userInitial}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-serif font-semibold text-[#1C1A17] truncate">{user.name}</p>
                              <p className="text-[10px] text-[#5A554C] truncate">{user.email}</p>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#C5A059]/30 text-[8px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                                {user.role === "admin" ? "Executive" : "Patron"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Links */}
                        <div className="py-1">
                          <Link
                            href="/orders"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#1C1A17] hover:bg-[#FAF8F5] transition-colors group"
                          >
                            <Package className="w-4 h-4 text-[#8C6D2B] group-hover:text-[#C5A059] transition-colors" />
                            <span className="font-medium">My Orders</span>
                          </Link>
                          <Link
                            href="/my-account"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#1C1A17] hover:bg-[#FAF8F5] transition-colors group"
                          >
                            <UserCircle className="w-4 h-4 text-[#8C6D2B] group-hover:text-[#C5A059] transition-colors" />
                            <span className="font-medium">My Account</span>
                          </Link>

                          {/* Admin shortcut (only for admin users) */}
                          {user.role === "admin" && (
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#1C1A17] hover:bg-[#FAF8F5] transition-colors group"
                            >
                              <Crown className="w-4 h-4 text-[#8C6D2B] group-hover:text-[#C5A059] transition-colors" />
                              <span className="font-medium">Executive Suite</span>
                            </Link>
                          )}
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-[#E8E2D5] pt-1">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-rose-700 hover:bg-rose-50 transition-colors group"
                          >
                            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            <span className="font-bold uppercase tracking-wider">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Not logged in — show sign-in icon */
                  <Link
                    href="/auth/login"
                    title="Sign In"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8E2D5] rounded-full transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center group-hover:border-[#C5A059] transition-colors">
                      <User className="h-4 w-4 text-[#1C1A17]" />
                    </div>
                    <span className="hidden sm:block text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B] group-hover:text-[#1C1A17] transition-colors">
                      Sign In
                    </span>
                  </Link>
                )}
              </div>

              {/* Shopping Bag Button */}
              <Link
                href="/cart"
                className="relative p-2 hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8E2D5] rounded-full transition-colors"
                title="Acquisition Bag"
              >
                <ShoppingCart className="h-4 w-4 text-[#1C1A17]" />
                <span className="absolute -top-1 -right-1 bg-[#1C1A17] text-[#D4AF37] border border-[#D4AF37]/50 font-mono text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                  {getCartItemsCount()}
                </span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#1C1A17] hover:bg-[#FAF8F5] border border-[#E8E2D5]"
                aria-label="Toggle Navigation"
              >
                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                  <span
                    className={`block h-0.5 w-5 bg-current transition-transform duration-300 ${isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                      }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-current transition-opacity duration-300 ${isMenuOpen ? "opacity-0" : ""
                      }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-current transition-transform duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                      }`}
                  />
                </div>
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#E8E2D5] animate-fade-in">
            <div className="px-6 py-4 space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-xs font-bold uppercase tracking-[0.2em] text-[#1C1A17] hover:text-[#C5A059] py-1.5 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ==================== 2. MAIN CONTENT WRAPPER ==================== */}
      <main className="flex-grow">{children}</main>

      {/* ==================== 3. GLOBAL LUXURY LIGHT FOOTER ==================== */}
      <footer className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F5] to-[#F5EFE4] border-t border-[#E8E2D5] text-[#1C1A17] pt-16 pb-12 relative overflow-hidden">

        {/* Ambient Halo Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {/* Brand Essence */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#8C6D2B]" />
                <span className="text-xl font-serif tracking-widest text-[#1C1A17] font-bold uppercase">
                  Maison
                </span>
              </div>
              <p className="text-xs text-[#5A554C] font-light leading-relaxed">
                An international haute-couture atelier celebrating master craftsmanship, bespoke tailoring, and timeless elegance.
              </p>
              <div className="pt-2 inline-flex items-center gap-1.5 text-[10px] text-[#7A7468] uppercase tracking-widest font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Certified Haute Sourced</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8C6D2B] mb-4">
                Atelier Directory
              </h4>
              <ul className="space-y-2.5 text-xs text-[#5A554C]">
                <li><Link href="/about" className="hover:text-[#1C1A17] transition-colors">Our Heritage</Link></li>
                <li><Link href="/contact" className="hover:text-[#1C1A17] transition-colors">Private Styling</Link></li>
                <li><Link href="/shop" className="hover:text-[#1C1A17] transition-colors">Complete Catalog</Link></li>
                <li><Link href="/sale" className="hover:text-[#1C1A17] transition-colors">Salon Outlet</Link></li>
              </ul>
            </div>

            {/* Client Concierge */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8C6D2B] mb-4">
                Client Concierge
              </h4>
              <ul className="space-y-2.5 text-xs text-[#5A554C]">
                <li><Link href="/orders" className="hover:text-[#1C1A17] transition-colors">Track Reservation</Link></li>
                <li><Link href="/contact" className="hover:text-[#1C1A17] transition-colors">Authentication FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-[#1C1A17] transition-colors">White-Glove Shipping</Link></li>
                <li><Link href="/contact" className="hover:text-[#1C1A17] transition-colors">Sartorial Size Guide</Link></li>
              </ul>
            </div>

            {/* VIP Club Privilege */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#8C6D2B] mb-4">
                Privilege Salon
              </h4>
              <p className="text-xs text-[#5A554C] font-light mb-4 leading-relaxed">
                Subscribe for private invitations to Trunk Shows and new curations.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] placeholder-[#9E988D] text-xs focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-[#1C1A17] hover:bg-[#C5A059] text-white py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Request Membership</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                </button>
              </form>
            </div>

          </div>

          {/* Copyright & Filigree Footer Line */}
          <div className="border-t border-[#E8E2D5] mt-12 pt-8 text-center text-xs text-[#7A7468] font-light flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} MAISON DE LUXE. All Rights Reserved.</p>
            <div className="flex gap-6 uppercase tracking-widest text-[10px] font-medium text-[#8C6D2B]">
              <span>Paris</span>
              <span>•</span>
              <span>Milan</span>
              <span>•</span>
              <span>Tokyo</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
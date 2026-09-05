"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Crown,
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  CreditCard,
  Users,
  BarChart3,
  LogOut,
  Gift,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      links: [{ href: "/admin/dashboard", label: "Overview" }],
    },
    {
      title: "Products",
      icon: Package,
      links: [
        { href: "/admin/brands", label: "Brands" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/products", label: "Products" },
        { href: "/admin/product-variants", label: "Product Variants" },
        { href: "/admin/inventory-log", label: "Inventory Log" },
      ],
    },
    {
      title: "Promotions",
      icon: Gift,
      links: [
        { href: "/admin/discounts", label: "Discounts" },
        { href: "/admin/coupons", label: "Coupons" },
        { href: "/admin/coupon-usages", label: "Coupon Usages" },
      ],
    },
    {
      title: "Orders & Shipping",
      icon: Truck,
      links: [
        { href: "/admin/orders", label: "Orders" },
      ],
    },
    {
      title: "Transactions",
      icon: CreditCard,
      links: [
        { href: "/admin/transactions", label: "Transactions" },
      ],
    },
    {
      title: "Users & Reviews",
      icon: Users,
      links: [
        { href: "/admin/users", label: "Users" },
        { href: "/admin/customer-chats", label: "Customer Chats" },
        { href: "/admin/reviews", label: "Reviews" },
        { href: "/admin/wishlist", label: "Wishlist" },
      ],
    },
    {
      title: "Reports & Notifications",
      icon: BarChart3,
      links: [
        { href: "/admin/reports", label: "Reports" },
        { href: "/admin/notifications", label: "Notifications" },
      ],
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const userData = localStorage.getItem("adminUser");

    if (!token) {
      router.push("/auth/login");
    } else {
      setUser(userData ? JSON.parse(userData) : null);
    }
  }, [router]);

  // Auto-expand section matching current pathname so section remains open
  useEffect(() => {
    if (!pathname) return;
    const activeSection = menuItems.find((menu) =>
      menu.links.some((link) => link.href === pathname)
    );
    if (activeSection) {
      setOpenMenus((prev) =>
        prev.includes(activeSection.title)
          ? prev
          : [...prev, activeSection.title]
      );
    }
  }, [pathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white">
      
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Luxury Atelier Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-72 bg-white/95 backdrop-blur-xl border-r border-[#E8E2D5] shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 lg:translate-x-0 z-40 flex flex-col justify-between`}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Header Brand */}
          <div className="p-6 border-b border-[#E8E2D5] flex items-center justify-between bg-gradient-to-b from-[#FAF8F5] to-transparent flex-shrink-0">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#1C1A17] border border-[#C5A059]/50 flex items-center justify-center shadow-md group-hover:bg-[#C5A059] transition-all duration-300">
                <Crown className="w-5 h-5 text-[#D4AF37] group-hover:text-white transition-colors" />
              </div>
              <div>
                <span className="text-sm font-serif font-bold uppercase tracking-[0.18em] text-[#1C1A17] block leading-none">
                  Maison
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mt-1 flex items-center gap-1">
                  Executive Suite <Sparkles className="w-2.5 h-2.5 text-[#C5A059]" />
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Accordion */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((menu) => {
              const IconComp = menu.icon;
              const isOpen = openMenus.includes(menu.title);
              const hasActiveChild = menu.links.some((link) => link.href === pathname);

              return (
                <div key={menu.title} className="rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleMenu(menu.title)}
                    className={`flex justify-between items-center w-full px-3.5 py-3 text-left rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-wider ${
                      isOpen || hasActiveChild
                        ? "bg-[#FAF8F5] text-[#1C1A17] border border-[#E8E2D5] shadow-sm"
                        : "text-[#5A554C] hover:text-[#1C1A17] hover:bg-[#FAF8F5]/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          hasActiveChild || isOpen
                            ? "bg-[#1C1A17] text-[#D4AF37]"
                            : "bg-[#FAF8F5] text-[#8C6D2B]"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="font-serif tracking-normal normal-case text-sm font-semibold">{menu.title}</span>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 text-[#8C6D2B] transform transition-transform duration-300 ease-out ${
                        isOpen ? "rotate-90 text-[#1C1A17]" : ""
                      }`}
                    />
                  </button>

                  {/* Smooth Animated Collapsible Section */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100 mt-1 mb-2"
                        : "grid-rows-[0fr] opacity-0 my-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-[#C5A059]/40 ml-5">
                        {menu.links.map((link) => {
                          const isActive = pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                isActive
                                  ? "bg-[#1C1A17] text-[#D4AF37] font-bold shadow-sm translate-x-1"
                                  : "text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#FAF8F5] hover:translate-x-0.5"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? "bg-[#D4AF37]" : "bg-[#C5A059]/40"
                                }`}
                              />
                              {link.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Action */}
        <div className="p-4 border-t border-[#E8E2D5] bg-gradient-to-t from-[#FAF8F5] to-transparent">
          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminUser");
              router.push("/auth/login");
            }}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg rounded-xl group hover:shadow-xl"
          >
            <LogOut className="w-4 h-4 text-[#D4AF37] group-hover:text-white transition-colors duration-300" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Luxury Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg
                className="h-5 w-5 text-[#1C1A17]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block">
                Maison Management
              </span>
              <h1 className="text-lg font-serif font-semibold text-[#1C1A17]">
                Atelier Command Center
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-serif font-semibold text-[#1C1A17] block">
                {user?.name || "DeshiStore Admin"}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C6D2B]">
                Executive Curator
              </span>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center text-[#8C6D2B] font-serif font-bold text-base shadow-sm">
              {(user?.name || "A")[0]}
            </div>
          </div>
        </header>

        {/* 🎥 Ambient Background Video Effect with Smooth Faded Edges (Centered) */}
        <div 
          className="fixed top-1/2 right-0 -translate-y-1/2 w-full lg:w-[calc(100%-18rem)] h-[40vh] overflow-hidden pointer-events-none z-0 opacity-40"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
          }}
        >
          <video
            src="/videos/bg_effect.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover filter brightness-110 contrast-105 transform translate-z-0"
          />
          <div className="absolute inset-0 bg-[#FAF8F5]/60 backdrop-blur-[2px]" />
        </div>

        {/* Dynamic Executive Page Content */}
        <main className="p-6 sm:p-10 flex-1 relative z-10">{children}</main>
      </div>
    </div>
  );
}

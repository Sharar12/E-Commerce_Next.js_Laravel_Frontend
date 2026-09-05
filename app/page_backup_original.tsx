"use client";

import React, { useState } from "react";
import Layout from "./components/Layouts";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Gem,
  Clock,
  CheckCircle2,
  ChevronRight,
  Award,
  Crown,
} from "lucide-react";
import FeaturedProductsSection from "./components/FeaturedProductsSection";
import NewArrivalsSection from "./components/NewArrivalsSection";

interface Category {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  itemCount: number;
  tag: string;
}

interface LuxuryPerk {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const categories: Category[] = [
    {
      id: "mens-fashion",
      name: "Men's Sartorial",
      subtitle: "Tailored Luxury & Modern Classics",
      image: "/men_fashon.jpg",
      itemCount: 234,
      tag: "Autumn Harvest '25",
    },
    {
      id: "womens-fashion",
      name: "Women's Haute Couture",
      subtitle: "Silks, Cashmere & Runway Pieces",
      image: "/women_fashon.jpg",
      itemCount: 189,
      tag: "Exclusive Runway",
    },
    {
      id: "electronics",
      name: "High-Fidelity & Tech",
      subtitle: "Precision Engineering & Audio",
      image: "/electronics.jpg",
      itemCount: 156,
      tag: "Bespoke Editions",
    },
    {
      id: "home-living",
      name: "Maison & Living",
      subtitle: "Artisanal Decor & Fine Interiors",
      image: "/home.webp",
      itemCount: 98,
      tag: "Limited Curations",
    },
  ];

  const luxuryPerks: LuxuryPerk[] = [
    {
      icon: Truck,
      title: "White-Glove Express",
      subtitle: "Complimentary Worldwide",
      description: "Insured door-to-door delivery on all orders over ৳20,000.",
    },
    {
      icon: ShieldCheck,
      title: "Certificate of Authenticity",
      subtitle: "Guaranteed Origin",
      description: "Every artifact is hand-inspected and verified by master jewelers.",
    },
    {
      icon: RotateCcw,
      title: "Bespoke Concierge Returns",
      subtitle: "30-Day Private Window",
      description: "Seamless door-side pickups arranged at your convenience.",
    },
    {
      icon: Gem,
      title: "Signature Packaging",
      subtitle: "Haute Gift Unboxing",
      description: "Encased in handcrafted archival linen boxes with silk ribboning.",
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <Layout>
      <div className="bg-[#FAF8F5] text-[#1C1A17] selection:bg-[#C5A059] selection:text-white font-sans antialiased">
        
        {/* ==================== 1. ULTRA-LUXURY HERO SECTION ==================== */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F7F3EC] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#E8E2D5]">
          {/* Subtle Ambient Background Glowing Halos */}
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#E2D4B9]/30 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[150px] pointer-events-none" />

          {/* Decorative Corner Filigree Lines */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-[#C5A059]/40 hidden lg:block" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-[#C5A059]/40 hidden lg:block" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Editorial Copy */}
              <div className="lg:col-span-7 space-y-8 text-left">
                
                {/* Haute Status Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/30 shadow-sm backdrop-blur-md">
                  <Crown className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#8C6D2B]">
                    Maison Exquisite • Summer Collection
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif tracking-tight text-[#111111] leading-[1.08]">
                  The Art of <br />
                  <span className="italic font-normal font-serif bg-gradient-to-r from-[#8C6D2B] via-[#C5A059] to-[#99732B] bg-clip-text text-transparent">
                    Effortless Grace
                  </span>
                
                </h1>

                {/* Subheading */}
                <p className="text-lg sm:text-xl text-[#5A554C] max-w-2xl leading-relaxed font-light">
                  Explore curations from master ateliers across Milan, Paris, and Tokyo. 
                  Handcrafted silhouettes designed to transcend seasons.
                </p>

                {/* Call To Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                  <Link
                    href="/shop"
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-semibold tracking-widest text-white uppercase transition-all duration-300 rounded-none bg-[#1C1A17] hover:bg-[#C5A059] shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight className="w-4 h-4 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/sale"
                    className="group inline-flex items-center justify-center px-8 py-4 text-sm font-semibold tracking-widest text-[#1C1A17] uppercase transition-all duration-300 border border-[#C5A059]/60 hover:border-[#1C1A17] bg-white/50 hover:bg-white backdrop-blur-sm"
                  >
                    <span>Private Salon Access</span>
                    <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  {/* 🧪 TEST PURPOSE LINK TO PAGE COPY */}
                  <Link
                    href="/test-copy"
                    className="group inline-flex items-center justify-center px-6 py-4 text-xs font-bold tracking-widest text-amber-800 uppercase transition-all duration-300 border border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-lg shadow-sm"
                    title="Test Copy Page Preview"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
                    <span>Test Page Copy (Preview)</span>
                  </Link>
                </div>

                {/* Stats / Trust Marks */}
                <div className="pt-8 border-t border-[#E8E2D5] grid grid-cols-3 gap-6 text-left">
                  <div>
                    <p className="text-2xl lg:text-3xl font-serif text-[#1C1A17]">100%</p>
                    <p className="text-xs uppercase tracking-wider text-[#8A8478] mt-1">Artisanal Sourced</p>
                  </div>
                  <div>
                    <p className="text-2xl lg:text-3xl font-serif text-[#1C1A17]">350+</p>
                    <p className="text-xs uppercase tracking-wider text-[#8A8478] mt-1">Haute Designers</p>
                  </div>
                  <div>
                    <p className="text-2xl lg:text-3xl font-serif text-[#1C1A17]">24/7</p>
                    <p className="text-xs uppercase tracking-wider text-[#8A8478] mt-1">Private Styling</p>
                  </div>
                </div>

              </div>

              {/* Right Hero Visual Feature */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  {/* Decorative Frame Border */}
                  <div className="absolute -inset-4 border border-[#C5A059]/30 rounded-2xl transform rotate-2 pointer-events-none" />
                  
                  {/* Hero Main Image Container */}
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-2xl bg-[#EFECE6] border border-white">
                    <Image
                      src="/women_fashon.jpg"
                      alt="Summer Couture Feature"
                      fill
                      priority
                      className="object-cover object-center scale-105 hover:scale-100 transition-transform duration-1000 ease-out"
                    />
                    
                    {/* Soft Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Floating Glassmorphism Badge */}
                    <div className="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-white/85 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#8C6D2B]">Featured Piece</p>
                        <p className="font-serif text-sm font-bold text-[#111111]">Silk Monogram Trench</p>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 bg-[#1C1A17] text-[#D4AF37] rounded">
                        ৳3,00,000
                      </span>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==================== 2. MAISON CONCIERGE & PERKS ==================== */}
        <section className="bg-white py-16 border-b border-[#E8E2D5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {luxuryPerks.map((perk, index) => {
                const IconComponent = perk.icon;
                return (
                  <div
                    key={index}
                    className="group relative p-6 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] hover:border-[#C5A059] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Icon Pedestal */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FAF8F5] to-[#EFEAE1] border border-[#C5A059]/40 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <IconComponent className="w-5 h-5 text-[#8C6D2B]" />
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-1">
                      {perk.subtitle}
                    </p>
                    <h3 className="text-lg font-serif font-semibold text-[#1C1A17] mb-2">
                      {perk.title}
                    </h3>
                    <p className="text-sm text-[#6E685E] leading-relaxed">
                      {perk.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== 3. FEATURED PRODUCTS INTEGRATION ==================== */}
        <section className="py-20 bg-[#FAF8F5] relative">
          
          {/* Decorative Section Header Divider */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="h-px w-12 bg-[#C5A059]/60" />
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-[#8C6D2B]">
                Selected Masterpieces
              </span>
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span className="h-px w-12 bg-[#C5A059]/60" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1C1A17]">
              The Curator&apos;s High Selection
            </h2>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-2 sm:p-6 bg-white/70 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <FeaturedProductsSection />
            </div>
          </div>
        </section>

        {/* ==================== NEW ARRIVALS SECTION ==================== */}
        <NewArrivalsSection />

        {/* ==================== 4. CURATED COLLECTIONS / CATEGORIES ==================== */}
        <section className="py-24 bg-white border-t border-b border-[#E8E2D5] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#C5A059] block mb-2">
                  Atelier Galleries
                </span>
                <h2 className="text-4xl sm:text-5xl font-serif text-[#1C1A17]">
                  Browse by Collection
                </h2>
              </div>
              <Link
                href="/categories"
                className="group inline-flex items-center text-sm font-semibold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors"
              >
                <span>View All 12 Departments</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="group relative rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#C5A059] transition-all duration-500 hover:shadow-2xl flex flex-col"
                >
                  {/* Image Frame */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-[#EFECE6]">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    
                    {/* Subtle Gradient Fog */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/80 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                    {/* Tag Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] rounded-sm shadow-sm">
                        {category.tag}
                      </span>
                    </div>

                    {/* Overlay Text Details */}
                    <div className="absolute bottom-0 inset-x-0 p-6 z-10 text-white transform group-hover:-translate-y-1 transition-transform duration-300">
                      <p className="text-xs text-[#D4AF37] font-medium tracking-wider mb-1">
                        {category.itemCount} Curated Items
                      </p>
                      <h3 className="text-2xl font-serif font-normal text-white mb-1">
                        {category.name}
                      </h3>
                      <p className="text-xs text-white/80 font-light line-clamp-1">
                        {category.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="p-4 bg-white flex items-center justify-between border-t border-[#E8E2D5]">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#1C1A17] group-hover:text-[#C5A059] transition-colors">
                      Discover Collection
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4 text-[#1C1A17] group-hover:text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* ==================== 5. BESPOKE VIP PRIVILEGE CLUB (NEWSLETTER) ==================== */}
        <section className="py-24 bg-gradient-to-br from-[#FFFDF9] via-[#F8F4EC] to-[#EFE7D8] relative overflow-hidden">
          
          {/* Subtle Metallic Background Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            
            {/* Crest Icon */}
            <div className="w-16 h-16 mx-auto rounded-full bg-white border border-[#C5A059]/40 flex items-center justify-center shadow-md mb-6">
              <Award className="w-8 h-8 text-[#C5A059]" />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#8C6D2B] block mb-3">
              By Private Invitation Only
            </span>

            <h2 className="text-4xl sm:text-6xl font-serif text-[#1C1A17] mb-6">
              Join The Maison Privilege Salon
            </h2>

            <p className="text-base sm:text-lg text-[#5A554C] max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Receive private salon invitations, priority access to ultra-limited Trunk Shows, and bespoke styling edits direct to your inbox.
            </p>

            {subscribed ? (
              <div className="p-6 bg-white/90 backdrop-blur-md rounded-xl border border-[#C5A059] max-w-md mx-auto shadow-xl animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-[#C5A059] mx-auto mb-3" />
                <h3 className="text-xl font-serif font-bold text-[#1C1A17]">Welcome to the Circle</h3>
                <p className="text-xs text-[#6E685E] mt-1">Your invitation key has been dispatched to your email.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your personal email address"
                    className="w-full px-6 py-4 bg-white/90 backdrop-blur-md border border-[#D4AF37]/50 text-[#1C1A17] placeholder-[#9E988D] rounded-none focus:outline-none focus:border-[#1C1A17] focus:ring-1 focus:ring-[#1C1A17] transition-all text-sm shadow-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md whitespace-nowrap"
                >
                  Request Membership
                </button>
              </form>
            )}

            {/* Privilege Perks Line */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-xs text-[#7A7468] uppercase tracking-wider font-medium">
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C5A059]" /> 24hr Priority Early Access
              </span>
              <span className="flex items-center gap-2">
                <Gem className="w-3.5 h-3.5 text-[#C5A059]" /> Complimentary Personal Styling
              </span>
            </div>

          </div>
        </section>

      </div>
    </Layout>
  );
}
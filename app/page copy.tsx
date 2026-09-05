"use client";

import React, { useState, useEffect, useRef } from "react";
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

export default function HomeCopy() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Video Scroll-Sync State & References
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentStop, setCurrentStop] = useState<number>(1);
  const targetStopIndexRef = useRef<number>(0);

  // 4 Stops normalized positions (0%, 33%, 66%, 100%)
  const stopFracs = [0, 0.333, 0.666, 1.0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start video playing continuously so the video decoder is never frozen
    video.play().catch(() => {});

    let animId: number;

    const syncLoop = () => {
      if (video.duration && !isNaN(video.duration)) {
        const targetTime = stopFracs[targetStopIndexRef.current] * video.duration;
        const diff = targetTime - video.currentTime;

        if (Math.abs(diff) > 0.05) {
          if (!video.paused && diff > 0) {
            // Forward motion: adjust speed dynamically based on distance to target stop
            video.playbackRate = Math.min(Math.max(diff * 1.5, 0.5), 3.0);
          } else {
            // If scrolling up or reverse target, smoothly update position without freeze
            video.currentTime += diff * 0.1;
          }
        } else {
          // Reached stop threshold: keep video idling smoothly
          video.playbackRate = 1.0;
        }
      }
      animId = requestAnimationFrame(syncLoop);
    };

    animId = requestAnimationFrame(syncLoop);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const scrollPct = Math.min(Math.max(window.scrollY / totalScroll, 0), 1);

        // Snap to 4 stops
        let stopIdx = 0;
        if (scrollPct >= 0.75) stopIdx = 3;
        else if (scrollPct >= 0.45) stopIdx = 2;
        else if (scrollPct >= 0.18) stopIdx = 1;
        else stopIdx = 0;

        targetStopIndexRef.current = stopIdx;
        setCurrentStop(stopIdx + 1);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
      <div className="relative text-[#1C1A17] selection:bg-[#C5A059] selection:text-white font-sans antialiased">
        
        {/* ==================== 🎬 SCROLL-SYNCED BACKGROUND VIDEO ==================== */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            src="/hero_video.mp4"
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-90 filter brightness-100 contrast-105"
          />
          {/* Subtle Overlay Glass for Contrast */}
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px]" />
        </div>

        {/* Floating Indicator of Current Scroll Stop (4 Stops) */}
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1A17]/90 backdrop-blur-md text-white px-4 py-2 rounded-full border border-[#C5A059] text-xs font-mono flex items-center gap-2 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-pulse" />
          <span>Scroll Stop: <strong>{currentStop} / 4</strong></span>
        </div>

        {/* Content Container (Glassmorphic Layered above video) */}
        <div className="relative z-10">
          
          {/* ==================== 1. ULTRA-LUXURY HERO SECTION ==================== */}
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                
                {/* Left Editorial Copy */}
                <div className="lg:col-span-7 space-y-8 text-left bg-white/40 p-8 rounded-3xl backdrop-blur-md border border-white/40 shadow-xl">
                  
                  {/* Haute Status Pill */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#D4AF37]/40 shadow-sm">
                    <Crown className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#8C6D2B]">
                      Maison Exquisite • Video Scroll-Sync Edition
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
                  <p className="text-lg sm:text-xl text-[#1C1A17] max-w-2xl leading-relaxed font-normal bg-white/70 p-4 rounded-xl backdrop-blur-sm border border-white/60">
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
                      className="group inline-flex items-center justify-center px-8 py-4 text-sm font-semibold tracking-widest text-[#1C1A17] uppercase transition-all duration-300 border border-[#C5A059]/60 hover:border-[#1C1A17] bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm"
                    >
                      <span>Private Salon Access</span>
                    </Link>
                  </div>

                  {/* Stats / Trust Marks */}
                  <div className="pt-8 border-t border-[#1C1A17]/10 grid grid-cols-3 gap-6">
                    <div>
                      <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17]">100%</span>
                      <span className="text-xs uppercase tracking-wider text-[#5A554C]">Authentic Origin</span>
                    </div>
                    <div>
                      <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17]">48h</span>
                      <span className="text-xs uppercase tracking-wider text-[#5A554C]">Concierge Dispatch</span>
                    </div>
                    <div>
                      <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17]">4 Stops</span>
                      <span className="text-xs uppercase tracking-wider text-[#8C6D2B]">Video Sync</span>
                    </div>
                  </div>

                </div>

                {/* Right Hero Image Card */}
                <div className="lg:col-span-5 relative">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
                    
                    {/* Decorative Card Framing */}
                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#C5A059]/20 via-transparent to-[#8C6D2B]/20 blur-xl opacity-70" />
                    
                    <div className="relative rounded-2xl overflow-hidden border border-white/60 bg-white/30 backdrop-blur-md shadow-2xl group">
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <Image
                          src="/women_fashon.jpg"
                          alt="Haute Couture Showcase"
                          fill
                          priority
                          className="object-cover object-center transform transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute bottom-6 left-6 right-6 text-white text-left space-y-2">
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37] block">
                            Atelier Spotlight
                          </span>
                          <h3 className="text-2xl font-serif font-bold text-white">
                            The Cashmere Overcoat
                          </h3>
                          <p className="text-xs text-white/80 line-clamp-2">
                            Spun from grade-A Mongolian cashmere with hand-stitched silk lapels.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ==================== 2. FEATURED PRODUCTS SECTION ==================== */}
          <div className="bg-white/40 backdrop-blur-md border-b border-white/20">
            <FeaturedProductsSection />
          </div>

          {/* ==================== 3. NEW ARRIVALS SECTION ==================== */}
          <div className="bg-white/30 backdrop-blur-md border-b border-white/20">
            <NewArrivalsSection />
          </div>

          {/* ==================== 4. LUXURY CATEGORIES GRID ==================== */}
          <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-[#E8E2D5]/80">
            <div className="max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">
                Curated Universes
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#1C1A17] tracking-tight">
                Explore by Domain
              </h2>
              <p className="text-sm text-[#6E685E] font-light">
                Discover masterworks grouped by artisanal discipline and modern lifestyle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.id}`}
                  className="floating-card group relative h-96 rounded-2xl overflow-hidden border border-[#E8E2D5] bg-white shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-end p-6 text-left"
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity group-hover:opacity-90" />
                  
                  <div className="relative z-10 space-y-2 text-white">
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-[#C5A059] text-white px-2.5 py-1 rounded-full inline-block">
                      {cat.tag}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-white/80 font-light">
                      {cat.subtitle}
                    </p>
                    <span className="inline-flex items-center text-xs font-semibold text-[#D4AF37] pt-2">
                      <span>Explore Collection</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ==================== 5. LUXURY PERKS SECTION ==================== */}
          <section className="py-20 bg-[#FAF8F5]/90 border-t border-[#E8E2D5]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {luxuryPerks.map((perk, idx) => {
                  const PerkIcon = perk.icon;
                  return (
                    <div key={idx} className="bg-white p-8 rounded-2xl border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all space-y-4 text-left group">
                      <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8C6D2B] group-hover:bg-[#1C1A17] group-hover:text-white transition-colors">
                        <PerkIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-lg text-[#1C1A17]">{perk.title}</h4>
                        <span className="text-xs font-bold text-[#8C6D2B] block uppercase tracking-wider mt-0.5">{perk.subtitle}</span>
                      </div>
                      <p className="text-xs text-[#6E685E] leading-relaxed font-light">{perk.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
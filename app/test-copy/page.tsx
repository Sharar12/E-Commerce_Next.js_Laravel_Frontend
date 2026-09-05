"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layouts";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Gem,
  Crown,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  Truck,
  RotateCcw,
  Film,
  Layers,
  Award,
  Video,
  Grid,
} from "lucide-react";
import FeaturedProductsSection from "../components/FeaturedProductsSection";
import NewArrivalsSection from "../components/NewArrivalsSection";

export default function TestLandingPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const video4Ref = useRef<HTMLVideoElement>(null);

  // Intersection Observer: Only play videos when in viewport to eliminate GPU lag
  useEffect(() => {
    const videoRefs = [video1Ref, video2Ref, video3Ref, video4Ref];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );

    videoRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const toggleMuteAll = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    if (video1Ref.current) video1Ref.current.muted = newState;
    if (video2Ref.current) video2Ref.current.muted = newState;
    if (video3Ref.current) video3Ref.current.muted = newState;
    if (video4Ref.current) video4Ref.current.muted = newState;
  };

  return (
    <Layout>
      <div className="relative bg-[#0F0E0C] text-white selection:bg-[#C5A059] selection:text-white font-sans antialiased min-h-screen">
        
        {/* Global Floating Sound Toggle */}
        <div className="fixed top-24 right-8 z-50 flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#C5A059] shadow-2xl">
          <span className="text-xs font-mono font-bold text-[#C5A059]">4 VIDEO SHOWCASE</span>
          <button
            onClick={toggleMuteAll}
            className="text-white hover:text-[#C5A059] transition-colors p-1"
            title={isMuted ? "Unmute Videos" : "Mute Videos"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#C5A059]" />}
          </button>
        </div>

        {/* ==================== 🎬 VIDEO 1: HERO TOP SECTION ==================== */}
        <div className="relative h-[90vh] w-full overflow-hidden flex items-center justify-center border-b border-white/10">
          <video
            ref={video1Ref}
            src="/videos/video1.mp4"
            preload="metadata"
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 transform translate-z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C] via-black/40 to-black/60" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/70 border border-[#C5A059] backdrop-blur-md">
              <Film className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37]">
                VIDEO 1 / 4 • MAIN PRODUCT COLLECTION
              </span>
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif text-white tracking-tight">
              The Art of <br />
              <span className="italic font-normal text-[#C5A059]">Effortless Elegance</span>
            </h1>

            <p className="text-lg text-white/80 max-w-2xl mx-auto font-light bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              Explore curations from master ateliers across Milan, Paris, and Tokyo.
            </p>

            <div className="pt-2">
              <Link href="/shop" className="px-8 py-4 bg-[#C5A059] text-[#1C1A17] font-bold text-xs tracking-widest uppercase hover:bg-white transition-all shadow-2xl inline-block">
                Explore Collection
              </Link>
            </div>
          </div>
        </div>

        {/* ==================== 🏆 FEATURED PRODUCTS ==================== */}
        <div className="py-0 bg-transparent">
          <FeaturedProductsSection />
        </div>

        {/* ==================== 🎬 VIDEO 2: FASHION CLOTHES ==================== */}
        <section className="relative py-28 overflow-hidden border-t border-b border-white/15 flex items-center justify-center">
          <video
            ref={video2Ref}
            src="/videos/video2.mp4"
            preload="metadata"
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50 filter brightness-95 transform translate-z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left space-y-4">
              <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase text-[#C5A059] flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>VIDEO 2 / 4 • HAUTE COUTURE & FASHION CLOTHES</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
                Handcrafted Italian Silk & Cashmere
              </h2>
              <p className="text-sm text-white/70 max-w-xl font-light leading-relaxed">
                Spun in Lombardy and hand-stitched by master weavers. Every detail reflects centuries of heritage.
              </p>
              <div className="pt-2">
                <Link href="/shop" className="px-6 py-3 bg-[#C5A059] text-[#1C1A17] font-bold text-xs tracking-widest uppercase hover:bg-white transition-all inline-block">
                  Discover Fabrics
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 🎬 VIDEO 3: ELECTRONIC DEVICES ==================== */}
        <section className="relative py-28 bg-[#161412] border-b border-white/15 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-5 text-left space-y-5">
              <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase text-[#D4AF37] flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>VIDEO 3 / 4 • ELECTRONIC DEVICES & HIGH-FIDELITY TECH</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
                Precision Engineering & Audio Innovation
              </h2>
              <p className="text-sm text-white/70 font-light leading-relaxed">
                Explore bespoke audio gear, acoustic engineering, and high-fidelity smart devices curated for modern living.
              </p>
              <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A059] hover:text-white transition-colors">
                <span>Explore Tech Editions</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right Dedicated Video Frame 3 */}
            <div className="lg:col-span-7 relative h-96 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <video
                ref={video3Ref}
                src="/videos/video3.mp4"
                preload="metadata"
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover filter brightness-95 transform translate-z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-6 text-xs font-mono font-bold text-[#C5A059]">
                🎥 ELECTRONIC DEVICES SHOWCASE (VIDEO 3)
              </div>
            </div>

          </div>
        </section>

        {/* ==================== 🏆 NEW ARRIVALS ==================== */}
        <div className="py-0 bg-transparent">
          <NewArrivalsSection />
        </div>

        {/* ==================== 🎬 VIDEO 4: VIDEO GAME STUFFS ==================== */}
        <section className="relative py-32 overflow-hidden border-t border-white/15 flex items-center justify-center">
          <video
            ref={video4Ref}
            src="/videos/video4.mp4"
            preload="metadata"
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40 filter brightness-85 contrast-105 transform translate-z-0"
          />
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
            <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase text-[#D4AF37] flex items-center justify-center gap-2">
              <Crown className="w-4 h-4 text-[#C5A059]" />
              <span>VIDEO 4 / 4 • PRIVATE SALON & SIGNATURE UNBOXING</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
              White-Glove Concierge & Signature Packaging
            </h2>
            <p className="text-sm text-white/70 max-w-xl mx-auto font-light leading-relaxed">
              Encased in handcrafted linen packaging with silk ribboning and door-to-door express delivery.
            </p>
            <div className="pt-2">
              <Link href="/sale" className="px-8 py-4 bg-white text-[#1C1A17] font-bold text-xs tracking-widest uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-2xl inline-block">
                Request Private Access
              </Link>
            </div>
          </div>
        </section>

        {/* ==================== 🏆 LUXURY GUARANTEES ==================== */}
        <section className="py-20 border-t border-white/10 bg-[#0F0E0C]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 bg-[#161412] rounded-2xl border border-white/10 space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#C5A059] mx-auto" />
              <h4 className="font-serif font-bold text-lg text-white">Hand-Inspected Authenticity</h4>
              <p className="text-xs text-white/60 font-light leading-relaxed">Certified origin guarantee on every atelier piece.</p>
            </div>

            <div className="p-8 bg-[#161412] rounded-2xl border border-white/10 space-y-3">
              <Truck className="w-8 h-8 text-[#C5A059] mx-auto" />
              <h4 className="font-serif font-bold text-lg text-white">White-Glove Worldwide Dispatch</h4>
              <p className="text-xs text-white/60 font-light leading-relaxed">Insured door-to-door express logistics.</p>
            </div>

            <div className="p-8 bg-[#161412] rounded-2xl border border-white/10 space-y-3">
              <RotateCcw className="w-8 h-8 text-[#C5A059] mx-auto" />
              <h4 className="font-serif font-bold text-lg text-white">Bespoke Concierge Returns</h4>
              <p className="text-xs text-white/60 font-light leading-relaxed">30-day private window with personal pickup.</p>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}

"use client";

import React from "react";
import { Sparkles, Clock, ArrowRight, Crown, AlertCircle } from "lucide-react";

interface CountdownTimerProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEndingSoon: boolean;
}

interface SaleBannerProps {
  banner?: {
    title?: string;
    subtitle?: string;
    description?: string;
    discount?: string | number;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
  };
  countdownTimer?: CountdownTimerProps;
  onCtaClick?: () => void;
}

const SaleBanner: React.FC<SaleBannerProps> = ({
  banner = {
    title: "The Private Salon Vault",
    subtitle: "Vente Privée & Haute Concessions",
    description: "Curated masterwork artifacts rendered with extraordinary concessions for our esteemed patrons.",
    discount: "UP TO 70% OFF",
    ctaText: "Explore Private Concessions",
  },
  countdownTimer = { days: 0, hours: 4, minutes: 28, seconds: 12, isEndingSoon: true },
  onCtaClick = () => {},
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#0F0E0C] border border-[#D4AF37]/50 shadow-xl p-8 md:p-12 mb-8">
      {/* Top Video Background */}
      <video
        src="/videos/video4.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 transform translate-z-0"
      />
      
      {/* Dark Overlay Matching Top Video Header */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C] via-black/50 to-black/70 pointer-events-none" />

      {/* Ambient Halo Background Lighting */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E2D4B9]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 relative z-10">
        
        {/* Left Column: Copy & CTAs */}
        <div className="flex-1 space-y-6">
          
          {/* Header Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-[#C5A059] shadow-sm backdrop-blur-md">
            <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#D4AF37]">
              Maison Private Salon • Limited Event
            </span>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight mb-2">
              {banner?.title || "The Private Salon Vault"}
            </h1>
            <p className="text-lg md:text-xl font-serif italic text-[#D4AF37]">
              {banner?.subtitle || "Vente Privée & Haute Concessions"}
            </p>
          </div>

          <p className="text-base text-white/80 font-light leading-relaxed max-w-2xl bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
            {banner?.description ||
              "Curated masterwork artifacts rendered with extraordinary concessions for our esteemed patrons."}
          </p>

          {/* Discount Pill Badge - Prominent Discount Styling */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-black/90 via-black/75 to-black/90 border border-[#D4AF37]/50 backdrop-blur-md rounded-full px-5 py-2 shadow-xl text-xs font-semibold tracking-wider text-white">
            <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span className="text-white/80 text-[11px] uppercase tracking-widest font-medium">Concessions</span>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#D4AF37] bg-clip-text drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">
              UP TO {typeof banner?.discount === 'number' ? `${banner.discount}%` : String(banner?.discount || "70%").replace(/UP TO\s*/i, "").replace(/OFF\s*/i, "").trim()} OFF
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[#D4AF37]/90 text-[11px] uppercase tracking-widest font-semibold">Limited Access</span>
          </div>

          {/* CTA Button */}
          <div>
            <button
              onClick={onCtaClick}
              className="group inline-flex items-center gap-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 border border-[#D4AF37]/50 rounded-xl"
            >
              <span>{banner?.ctaText || "Explore Private Concessions"}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>

        </div>

        {/* Right Column: Glassmorphic Countdown Box */}
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-[#C5A059]/40 shadow-xl min-w-full sm:min-w-[340px] lg:min-w-[380px]">
          <div className="text-center">
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Vault Access Closing In
              </span>
            </div>

            {/* Timer Digits Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              
              {/* Days */}
              <div className="bg-black/80 border border-[#C5A059]/30 rounded-xl p-3 text-center shadow-inner">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
                  {countdownTimer?.days ?? 0}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mt-1">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="bg-black/80 border border-[#C5A059]/30 rounded-xl p-3 text-center shadow-inner">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
                  {String(countdownTimer?.hours ?? 0).padStart(2, "0")}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mt-1">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-black/80 border border-[#C5A059]/30 rounded-xl p-3 text-center shadow-inner">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
                  {String(countdownTimer?.minutes ?? 0).padStart(2, "0")}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mt-1">
                  Mins
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-black/80 border border-[#C5A059]/30 rounded-xl p-3 text-center shadow-inner">
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white">
                  {String(countdownTimer?.seconds ?? 0).padStart(2, "0")}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mt-1">
                  Secs
                </div>
              </div>

            </div>

            {/* Ending Soon Warning Pill */}
            {countdownTimer?.isEndingSoon ? (
              <div className="bg-amber-950/40 border border-[#C5A059]/60 text-[#D4AF37] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase inline-flex items-center justify-center gap-2 w-full">
                <AlertCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                Final Window • Concessions Closing
              </div>
            ) : (
              <div className="bg-black/40 border border-white/10 text-white/80 px-4 py-2 rounded-xl text-xs font-medium tracking-wider uppercase inline-flex items-center justify-center gap-2 w-full">
                Guaranteed Atelier Availability
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default SaleBanner;
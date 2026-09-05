"use client";

import React, { useState } from "react";
import Layout from "../components/Layouts";
import {
  Crown,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Globe,
  ArrowRight,
} from "lucide-react";

interface ContactFormData {
  fullName: string;
  email: string;
  inquiryType: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    email: "",
    inquiryType: "bespoke-sourcing",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate concierge API dispatch
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const directChannels = [
    {
      icon: Phone,
      title: "Private Concierge Desk",
      detail: "+33 (0)1 42 68 55 00",
      subtext: "Mon – Sat, 9:00 to 20:00 CET",
    },
    {
      icon: Mail,
      title: "Direct Salon Correspondence",
      detail: "concierge@maison.com",
      subtext: "Response within 2 business hours",
    },
    {
      icon: MessageSquare,
      title: "VIP WhatsApp Channel",
      detail: "+33 (0)6 00 00 00 00",
      subtext: "24/7 Priority Styling Support",
    },
  ];

  const flagshipSalons = [
    {
      city: "Paris Flagship",
      address: "12 Avenue Montaigne, 75008 Paris",
      phone: "+33 (0)1 42 68 55 01",
      hours: "10:00 – 19:30 CET",
    },
    {
      city: "Milano Salon",
      address: "Via Monte Napoleone 8, 20121 Milano",
      phone: "+39 02 7600 0000",
      hours: "10:00 – 19:00 CET",
    },
    {
      city: "Tokyo Atelier",
      address: "5-7-19 Ginza, Chuo-ku, Tokyo 104-0061",
      phone: "+81 3 5500 0000",
      hours: "11:00 – 20:00 JST",
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">

        {/* ==================== 1. CONCIERGE HEADER ==================== */}
        <header className="relative bg-gradient-to-b from-[#F7F3EC] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#E8E2D5] py-16 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/30 shadow-sm backdrop-blur-md mb-4">
              <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">
                Maison Direct Channels • Private Concierge
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif text-[#111111] tracking-tight leading-tight mb-3">
              Atelier Concierge & Styling
            </h1>
            <p className="text-sm sm:text-base text-[#5A554C] max-w-2xl mx-auto font-light leading-relaxed">
              Our dedicated private salon advisors stand ready to assist with bespoke fittings, private appointments, and global order reservations.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

          {/* DIRECT CHANNELS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {directChannels.map((channel, index) => {
              const IconComp = channel.icon;
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all duration-300 flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <IconComp className="w-5 h-5 text-[#8C6D2B]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B] block mb-1">
                      {channel.title}
                    </span>
                    <p className="font-serif font-bold text-base text-[#1C1A17] mb-1">
                      {channel.detail}
                    </p>
                    <p className="text-xs text-[#7A7468] font-light">
                      {channel.subtext}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* ==================== 2. PRIVATE INQUIRY FORM ==================== */}
            <section className="lg:col-span-7 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-8 sm:p-10 shadow-sm">
              <div className="mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
                  Private Salon Request
                </span>
                <h2 className="text-3xl font-serif text-[#1C1A17]">
                  Dispatch an Inquiry
                </h2>
                <p className="text-xs text-[#5A554C] font-light leading-relaxed mt-2">
                  Complete the specifications below. A dedicated Maison Client Advisor will reply within two business hours.
                </p>
              </div>

              {isSubmitted ? (
                <div className="bg-[#FFF9EE] border border-[#C5A059]/50 rounded-2xl p-8 text-center space-y-4 animate-fade-in shadow-sm">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white border border-[#C5A059] flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-[#8C6D2B]" />
                  </div>
                  <h3 className="text-2xl font-serif text-[#1C1A17]">
                    Inquiry Dispatched
                  </h3>
                  <p className="text-xs text-[#5A554C] font-light leading-relaxed max-w-md mx-auto">
                    Your request has been encrypted and routed directly to our Paris Salon Concierge Desk. You will receive an advisory summary at your email address shortly.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                  >
                    <span>Send Another Specification</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Lady Katherine Vance"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] focus:ring-1 focus:ring-[#1C1A17] transition-all shadow-inner"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      Executive Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="patron@maison.com"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] focus:ring-1 focus:ring-[#1C1A17] transition-all shadow-inner"
                    />
                  </div>

                  {/* Inquiry Type Select */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      Department / Inquiry Nature
                    </label>
                    <select
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold uppercase tracking-wider rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner cursor-pointer"
                    >
                      <option value="bespoke-sourcing">Bespoke Sourcing & Custom Fittings</option>
                      <option value="private-appointment">Private Salon Appointment Request</option>
                      <option value="order-reservation">Order Tracking & Reservation Assistance</option>
                      <option value="press-relations">Press & Diplomatic Relations</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      Inquiry Specifications
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      placeholder="Describe your desired fittings, product references, or private appointment dates..."
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] focus:ring-1 focus:ring-[#1C1A17] transition-all shadow-inner leading-relaxed"
                    />
                  </div>

                  {/* Submit Trigger */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] disabled:bg-[#1C1A17]/60 text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="w-4 h-4 text-[#D4AF37] animate-spin" />
                        <span>Encrypting & Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <span>Dispatch Concierge Specification</span>
                        <Send className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-white transition-colors" />
                      </>
                    )}
                  </button>

                </form>
              )}
            </section>

            {/* ==================== 3. FLAGSHIP ATELIERS & CONCIERGE ==================== */}
            <aside className="lg:col-span-5 space-y-8">

              {/* Flagship Salons Box */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
                    Global Destinations
                  </span>
                  <h3 className="text-2xl font-serif text-[#1C1A17]">
                    Flagship Ateliers
                  </h3>
                </div>

                <div className="space-y-6">
                  {flagshipSalons.map((salon, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] hover:border-[#C5A059] transition-all duration-300 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-[#1C1A17]">
                          {salon.city}
                        </h4>
                        <span className="text-[10px] font-mono text-[#8C6D2B] bg-white px-2.5 py-0.5 rounded border border-[#E8E2D5]">
                          {salon.hours}
                        </span>
                      </div>

                      <p className="text-xs text-[#5A554C] flex items-center gap-2 font-light">
                        <MapPin className="w-3.5 h-3.5 text-[#8C6D2B] flex-shrink-0" />
                        {salon.address}
                      </p>

                      <p className="text-xs text-[#5A554C] flex items-center gap-2 font-light">
                        <Phone className="w-3.5 h-3.5 text-[#8C6D2B] flex-shrink-0" />
                        {salon.phone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocol Trust Mark */}
              <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F5] to-[#F5EFE4] rounded-2xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-3 text-center">
                <ShieldCheck className="w-8 h-8 text-[#8C6D2B] mx-auto" />
                <h4 className="font-serif font-semibold text-sm text-[#1C1A17]">
                  Encrypted Maison Privacy
                </h4>
                <p className="text-xs text-[#5A554C] font-light leading-relaxed">
                  All correspondence and client styling requirements are safeguarded under strict diplomatic privacy protocols.
                </p>
              </div>

            </aside>

          </div>
        </main>
      </div>
    </Layout>
  );
}
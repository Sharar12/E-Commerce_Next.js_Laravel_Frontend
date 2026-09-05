"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
      <p className="text-xs text-[#8C6D2B] font-bold uppercase tracking-widest">
        Redirecting to unified login...
      </p>
    </div>
  );
}

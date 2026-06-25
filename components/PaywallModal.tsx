"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Coffee, ShieldCheck } from "lucide-react";
import { checkoutProductCatalog } from "@/lib/commerce";

type PaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (itemType: string) => {
    setIsLoading(itemType);
    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout failed", err);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-[#0A0A0A] sm:rounded-3xl rounded-t-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden pb-safe"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors z-10"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="relative pt-10 pb-6 px-6 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary-amber/20 blur-[50px] pointer-events-none" />
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-amber/20 to-primary-amber/5 border border-primary-amber/30 text-primary-amber mb-4">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-black font-serif text-foreground tracking-tight mb-2">
              무료 스캔 횟수 초과
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              이번 달 무료 AI 스캔 3회를 모두 사용하셨습니다.<br/>
              Premium으로 업그레이드하고 무제한으로 즐겨보세요!
            </p>
          </div>

          {/* Pricing Options */}
          <div className="px-6 pb-8 space-y-4">
            {/* Premium Subscription */}
            <div className="relative rounded-2xl border-2 border-primary-amber/50 bg-primary-amber/5 overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary-amber text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Best Value
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">CoffeeDex Premium</h3>
                    <p className="text-primary-amber font-bold text-xl mt-1">$3.99 <span className="text-sm font-normal text-muted-foreground">/월</span></p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {checkoutProductCatalog.premium_subscription.benefits.map((b, i) => (
                    <li key={i} className="flex items-center text-sm text-foreground/80 gap-2">
                      <ShieldCheck size={16} className="text-primary-amber shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isLoading !== null}
                  onClick={() => handleCheckout("premium_subscription")}
                  className="w-full py-3.5 px-4 rounded-xl font-bold bg-primary-amber text-black hover:bg-primary-amber/90 transition-colors disabled:opacity-50"
                >
                  {isLoading === "premium_subscription" ? "처리 중..." : "Premium 구독하기"}
                </button>
              </div>
            </div>

            {/* 10-Pack Option */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-md font-bold text-foreground">10팩 충전</h3>
                  <p className="text-white font-bold text-lg mt-1">$4.99 <span className="text-sm font-normal text-muted-foreground">/일회성</span></p>
                </div>
                <Coffee className="text-muted-foreground" size={24} />
              </div>
              
              <button
                disabled={isLoading !== null}
                onClick={() => handleCheckout("credits_10")}
                className="w-full py-3 px-4 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {isLoading === "credits_10" ? "처리 중..." : "10회 충전하기"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  readCheckoutNoticeFromSearch,
  type CheckoutNotice,
} from "@/lib/checkout-return";

export function useDashboardCheckoutReturn(initialNotice: CheckoutNotice | null) {
  const queryClient = useQueryClient();
  const [checkoutNotice, setCheckoutNotice] = useState<CheckoutNotice | null>(initialNotice);

  useEffect(() => {
    const notice = initialNotice ?? readCheckoutNoticeFromSearch(globalThis.location.search);
    if (!notice) return;

    setCheckoutNotice(notice);
    if (notice.status === "success") {
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
      void queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#8B5A2B", "#CD853F", "#F5F5DC", "#D2B48C", "#4A3B32"],
        });
      } catch (confettiError) {
        console.error("Confetti launch failed:", confettiError);
      }
    }

    window.setTimeout(() => globalThis.history.replaceState(null, "", "/dashboard"), 50);
  }, [initialNotice, queryClient]);

  return {
    checkoutNotice,
    dismissCheckoutNotice: () => setCheckoutNotice(null),
  } as const;
}

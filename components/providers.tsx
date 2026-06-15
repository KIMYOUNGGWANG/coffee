"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createStarterQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createStarterQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

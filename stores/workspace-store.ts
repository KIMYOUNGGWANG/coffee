"use client";

import { create } from "zustand";
import { starterWorkspaces } from "@/lib/contracts";

type WorkspaceStore = {
  activeWorkspaceId: string;
  setActiveWorkspaceId: (workspaceId: string) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  activeWorkspaceId: starterWorkspaces[1]?.id ?? starterWorkspaces[0]?.id ?? "",
  setActiveWorkspaceId: (workspaceId) => {
    set({ activeWorkspaceId: workspaceId });
  },
}));

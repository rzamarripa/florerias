import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Branch as BranchType } from "@/features/admin/modules/branches/types";

// Usar el tipo existente del módulo de branches
export type Branch = BranchType;

interface ActiveBranchState {
  activeBranch: Branch | null;
}

interface ActiveBranchActions {
  setActiveBranch: (branch: Branch | null) => void;
  clearActiveBranch: () => void;
}

type ActiveBranchStore = ActiveBranchState & ActiveBranchActions;

export const useActiveBranchStore = create<ActiveBranchStore>()(
  persist(
    (set) => ({
      activeBranch: null,

      setActiveBranch: (branch: Branch | null) => {
        set({ activeBranch: branch });
      },

      clearActiveBranch: () => {
        set({ activeBranch: null });
      },
    }),
    {
      name: "active-branch",
    }
  )
);

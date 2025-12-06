import { create } from "zustand";

interface BranchModalState {
  showBranchSelectionModal: boolean;
  showCreateBranchModal: boolean;
  isRequiredSelection: boolean;
}

interface BranchModalActions {
  openBranchSelectionModal: (isRequired?: boolean) => void;
  closeBranchSelectionModal: () => void;
  openCreateBranchModal: () => void;
  closeCreateBranchModal: () => void;
  reopenBranchSelectionAfterCreate: () => void;
}

type BranchModalStore = BranchModalState & BranchModalActions;

export const useBranchModalStore = create<BranchModalStore>()((set) => ({
  showBranchSelectionModal: false,
  showCreateBranchModal: false,
  isRequiredSelection: false,

  openBranchSelectionModal: (isRequired = false) => {
    set({
      showBranchSelectionModal: true,
      showCreateBranchModal: false,
      isRequiredSelection: isRequired,
    });
  },

  closeBranchSelectionModal: () => {
    set({ showBranchSelectionModal: false, isRequiredSelection: false });
  },

  openCreateBranchModal: () => {
    set({
      showCreateBranchModal: true,
      showBranchSelectionModal: false,
    });
  },

  closeCreateBranchModal: () => {
    set({ showCreateBranchModal: false });
  },

  reopenBranchSelectionAfterCreate: () => {
    set({
      showCreateBranchModal: false,
      showBranchSelectionModal: true,
      isRequiredSelection: true,
    });
  },
}));

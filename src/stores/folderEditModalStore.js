// src/stores/folderEditModalStore.js

import { create } from 'zustand';

const useFolderEditModalStore = create((set) => ({
  // --- State ---
  isOpen: false,
  editingFolder: null,
  error: null,
  // === STATE BARU: Pemicu untuk refresh data ===
  updateTrigger: 0, 

  // --- Actions ---
  openModal: (folder) => {
    if (!folder || !folder.id) {
      console.error("Data folder tidak valid untuk diedit.");
      return;
    }
    set({ 
      isOpen: true, 
      editingFolder: folder, 
      error: null 
    });
  },

  closeModal: () => {
    set({
      isOpen: false,
      editingFolder: null,
      error: null
    });
  },

  // === AKSI BARU: Fungsi untuk memicu update di komponen lain ===
  triggerUpdate: () => {
    set((state) => ({ updateTrigger: state.updateTrigger + 1 }));
  }
}));

export default useFolderEditModalStore;
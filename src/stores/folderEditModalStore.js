// src/stores/folderEditModalStore.js

import { create } from 'zustand';
import { supabase } from '../supabaseClient';

const useFolderEditModalStore = create((set) => ({
  // --- State ---
  isOpen: false,          // Apakah modal sedang terbuka?
  isLoading: true,        // Apakah sedang memuat data?
  editingFolder: null,    // Folder yang sedang diedit (berisi id, title)
  error: null,            // Pesan error jika terjadi

  // --- Actions ---

  /**
   * Fungsi untuk membuka modal dan memuat data folder yang akan diedit.
   * @param {object} folder - Objek folder yang akan diedit. Minimal harus ada { id, title }.
   */
  openModal: (folder) => {
    if (!folder || !folder.id) {
      console.error("Data folder tidak valid untuk diedit.");
      return;
    }
    console.log(`📂 Membuka modal untuk mengedit folder: ${folder.title} (ID: ${folder.id})`);
    // Tidak perlu loading karena data folder (id dan title) sudah kita miliki
    set({ 
      isOpen: true, 
      isLoading: false, 
      editingFolder: folder, 
      error: null 
    });
  },

  /**
   * Fungsi untuk menutup modal dan mereset semua state.
   */
  closeModal: () => {
    set({
      isOpen: false,
      editingFolder: null,
      isLoading: true,
      error: null
    });
  },
}));

export default useFolderEditModalStore;

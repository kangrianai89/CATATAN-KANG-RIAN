// src/stores/editModalStore.js
import { create } from 'zustand';
import { supabase } from '../supabaseClient';

const useEditModalStore = create((set, get) => ({
  isOpen: false,
  editingItem: null,
  allFolders: [],
  isLoading: false,

  openModal: async (itemId) => {
    if (get().isOpen) return;

    // Ambil user saat ini untuk query yang aman
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Pengguna tidak login, tidak bisa membuka modal edit.");
      return;
    }

    set({ isLoading: true, isOpen: true });
    try {
      // PERBAIKAN: Query ke tabel yang benar dan pastikan item milik user
      const [itemRes, foldersRes] = await Promise.all([
        supabase.from('workspace_items').select('*').eq('id', itemId).eq('user_id', user.id).single(),
        supabase.from('workspace_items').select('id, title').eq('type', 'folder').eq('user_id', user.id)
      ]);

      // Error handling yang lebih baik
      if (itemRes.error) {
        // Error 'PGRST116' terjadi jika .single() tidak menemukan baris
        if (itemRes.error.code === 'PGRST116') {
          throw new Error(`Catatan dengan ID ${itemId} tidak ditemukan.`);
        }
        throw itemRes.error;
      }
      if (foldersRes.error) throw foldersRes.error;

      set({ 
        editingItem: itemRes.data, 
        allFolders: foldersRes.data,
        isLoading: false 
      });

    } catch (error) {
      console.error("Gagal memuat data untuk modal:", error);
      alert("Gagal memuat data catatan: " + error.message);
      set({ isLoading: false, isOpen: false, editingItem: null });
    }
  },

  closeModal: () => {
    set({ 
      isOpen: false, 
      editingItem: null, 
      allFolders: [],
      isLoading: false
    });
  },
}));

export default useEditModalStore;

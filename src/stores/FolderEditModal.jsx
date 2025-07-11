// src/components/FolderEditModal.jsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// Mengambil dari store yang benar
import useFolderEditModalStore from '../stores/folderEditModalStore.js'; 

function FolderEditModal() {
  // === PERUBAHAN: Mengambil aksi 'triggerUpdate' dari store ===
  const { isOpen, editingFolder, closeModal, triggerUpdate } = useFolderEditModalStore();

  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingFolder) {
      setTitle(editingFolder.title);
    }
  }, [editingFolder]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !editingFolder) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('workspace_items')
        .update({ title: title.trim() })
        .eq('id', editingFolder.id);

      if (error) throw error;

      alert('Nama folder berhasil diperbarui!');
      
      // === PERUBAHAN: Ganti reload dengan triggerUpdate ===
      // Hapus baris ini: window.location.reload(); 
      triggerUpdate(); // Panggil sinyal update
      closeModal();

    } catch (err) {
      alert('Gagal memperbarui nama folder: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSave}>
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold dark:text-white">Edit Nama Folder</h2>
          </div>
          <div className="p-6">
            <label htmlFor="folderName" className="block text-sm font-medium mb-2 dark:text-gray-300">
              Nama Folder
            </label>
            <input
              id="folderName"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              autoFocus
            />
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-4 rounded-b-lg">
            <button 
              type="button" 
              onClick={closeModal} 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-black dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !title.trim()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400 hover:bg-blue-700"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FolderEditModal;
// src/components/NoteItemEditModal.jsx

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../supabaseClient';
import useEditModalStore from '../stores/editModalStore.js';
import MenuBar from './MenuBar';

function NoteItemEditModal() {
  // --- Mengambil semua state dan aksi dari store (Zustand) ---
  const { isOpen, editingItem, allFolders, isLoading, error, closeModal } = useEditModalStore();

  // State lokal hanya untuk form input dan status penyimpanan
  const [title, setTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none',
      },
    },
  });

  // Efek ini berjalan HANYA ketika 'editingItem' dari store berubah (saat data selesai dimuat)
  useEffect(() => {
    // Pastikan ada item yang diedit dan editor sudah siap
    if (editingItem && editor) {
      console.log('✍️ Memuat data ke dalam modal edit:', editingItem);
      setTitle(editingItem.title);
      // PERBAIKAN: Menggunakan 'parent_id' sesuai skema database
      setSelectedFolderId(editingItem.parent_id || ''); // Gunakan string kosong jika null
      // Set konten editor. Pastikan tidak null.
      editor.commands.setContent(editingItem.content || '', false);
    }
  }, [editingItem, editor]);

  const handleSave = async () => {
    if (!editor || !editingItem) return;
    setIsSaving(true);
    const finalContent = editor.getHTML();
    
    try {
      // PERBAIKAN KRUSIAL:
      // - Update ke tabel `workspace_items` yang benar.
      // - Gunakan kolom `parent_id` untuk relasi folder.
      const { error } = await supabase
        .from('workspace_items')
        .update({ 
          title: title, 
          content: finalContent, 
          parent_id: selectedFolderId || null // Simpan null jika tidak ada folder dipilih
        })
        .eq('id', editingItem.id);

      if (error) throw error;
      
      alert('Catatan berhasil diperbarui!');
      closeModal(); // Tutup modal setelah berhasil
      
    } catch (err) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Jangan render apapun jika modal tidak seharusnya terbuka
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Edit Catatan</h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {/* Body Modal */}
        {isLoading ? (
          <div className="flex-grow flex justify-center items-center">
            <p className="dark:text-white text-lg">Memuat data catatan...</p>
          </div>
        ) : error ? (
           <div className="flex-grow flex justify-center items-center p-4">
            <p className="text-red-500 text-center">{error}</p>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* --- Input Pindah Folder --- */}
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Folder</label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">-- Tidak ada (di Ruang Kerja) --</option>
                  {allFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.title}</option>
                  ))}
                </select>
              </div>
              {/* --- Input Judul --- */}
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Judul</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {/* --- Editor Konten --- */}
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Konten</label>
                <div className="border rounded-lg dark:border-gray-600">
                  <MenuBar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
            {/* Footer Modal dengan Tombol Aksi */}
            <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-4">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-black dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Batal</button>
              <button onClick={handleSave} disabled={isSaving || !editor} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400 hover:bg-blue-700">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NoteItemEditModal;

import { useState } from 'react';
import { supabase } from '../supabaseClient';

function FolderManagementModal({ isOpen, onClose, user, onFolderCreated, parentId = null }) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Judul Folder harus diisi!");
            return;
        }
        setIsSaving(true);
        try {
            // PERBAIKAN: Menyimpan ke tabel 'workspace_items' dengan struktur baru
            const { data, error } = await supabase.from('workspace_items').insert({
                title: title,
                user_id: user.id,
                type: 'folder', // Secara eksplisit mengatur tipe sebagai folder
                parent_id: parentId // Menggunakan parentId dari props, atau null jika tidak ada
            }).select().single();

            if (error) throw error;

            onFolderCreated(data); // Kirim data folder baru ke parent
            alert(`Folder "${data.title}" berhasil dibuat!`);
            handleClose(); // Panggil handleClose untuk reset dan tutup
        } catch (error) {
            alert("Gagal membuat folder: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Reset state saat modal ditutup
    const handleClose = () => {
        setTitle('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Buat Folder Baru</h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&times;</button>
                </div>
                <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nama Folder</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            required 
                            autoFocus
                        />
                    </div>
                    {/* PERBAIKAN: Menghapus input deskripsi */}
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan Folder'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default FolderManagementModal;

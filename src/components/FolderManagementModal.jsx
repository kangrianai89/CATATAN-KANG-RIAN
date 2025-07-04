import { useState } from 'react';
import { supabase } from '../supabaseClient';

function FolderManagementModal({ isOpen, onClose, user, onFolderCreated }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Judul Folder harus diisi!");
            return;
        }
        try {
            const { data, error } = await supabase.from('notes').insert({
                title: title,
                description: description,
                user_id: user.id,
                pinned: false
            }).select().single();

            if (error) throw error;

            onFolderCreated(data); // Kirim data folder baru ke parent
            alert(`Folder "${data.title}" berhasil dibuat!`);
            onClose(); // Tutup modal
        } catch (error) {
            alert("Gagal membuat folder: " + error.message);
        }
    };
    
    // Reset state saat modal ditutup
    const handleClose = () => {
        setTitle('');
        setDescription('');
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
                        <label className="block text-sm font-medium mb-1">Judul Folder</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                    <button type="submit" className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700">Simpan Folder</button>
                </form>
            </div>
        </div>
    );
}

export default FolderManagementModal;
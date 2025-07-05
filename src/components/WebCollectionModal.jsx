import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Props collectionToEdit ditambahkan, dan onCollectionUpdated untuk handle hasil edit
function WebCollectionModal({ isOpen, onClose, user, onCollectionCreated, collectionToEdit, onCollectionUpdated }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = Boolean(collectionToEdit);

    useEffect(() => {
        // Jika dalam mode edit, isi form dengan data yang ada. Jika tidak, kosongkan.
        if (isOpen) {
            if (isEditMode) {
                setTitle(collectionToEdit.title);
                setDescription(collectionToEdit.description || '');
            } else {
                setTitle('');
                setDescription('');
            }
        }
    }, [isOpen, collectionToEdit, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Judul koleksi harus diisi!");
            return;
        }
        setIsSubmitting(true);

        try {
            let data, error;

            if (isEditMode) {
                // LOGIKA UNTUK UPDATE
                ({ data, error } = await supabase
                    .from('web_collections')
                    .update({ title: title.trim(), description: description.trim() })
                    .eq('id', collectionToEdit.id)
                    .select()
                    .single());
            } else {
                // LOGIKA UNTUK INSERT (TAMBAH BARU)
                ({ data, error } = await supabase
                    .from('web_collections')
                    .insert({ title: title.trim(), description: description.trim(), user_id: user.id })
                    .select()
                    .single());
            }
            
            if (error) throw error;

            if (isEditMode) {
                alert('Koleksi berhasil diperbarui!');
                onCollectionUpdated(data); // Panggil fungsi callback untuk update
            } else {
                alert('Koleksi baru berhasil dibuat!');
                onCollectionCreated(data); // Panggil fungsi callback untuk create
            }
            handleClose();

        } catch (err) {
            alert("Gagal menyimpan data: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">
                        {isEditMode ? 'Edit Detail Koleksi' : 'Buat Koleksi Baru'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="collectionTitle" className="block text-sm font-medium mb-1 dark:text-gray-300">Judul Koleksi</label>
                            <input
                                id="collectionTitle"
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-white"
                                placeholder="Contoh: Tutorial Desain Grafis"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="collectionDescription" className="block text-sm font-medium mb-1 dark:text-gray-300">Deskripsi (Opsional)</label>
                            <textarea
                                id="collectionDescription"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows="3"
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:text-white"
                                placeholder="Kumpulan link dan aset untuk belajar desain..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-4 pt-2">
                            <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300">
                                Batal
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400">
                                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Buat Koleksi')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default WebCollectionModal;
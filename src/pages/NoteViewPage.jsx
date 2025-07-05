import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';
import NoteItemEditModal from '../components/NoteItemEditModal'; // Import modal

function NoteViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);
    const [allFolders, setAllFolders] = useState([]); // State untuk daftar folder
    const [isModalOpen, setIsModalOpen] = useState(false); // State untuk modal

    const fetchItemData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Ambil detail item dan semua folder secara bersamaan
            const [itemRes, foldersRes] = await Promise.all([
                supabase.from('note_items').select('*, notes(id, title)').eq('id', id).single(),
                supabase.from('notes').select('id, title')
            ]);

            if (itemRes.error) throw itemRes.error;
            if (foldersRes.error) throw foldersRes.error;

            setItem(itemRes.data);
            setAllFolders(foldersRes.data);

        } catch (error) {
            alert("Gagal memuat data: " + error.message);
            setItem(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchItemData();
    }, [id, fetchItemData]);
    
    // Fungsi untuk menangani penyimpanan dari modal
    const handleUpdateItem = async (itemId, newTitle, newContent, newFolderId) => {
        try {
            const { data, error } = await supabase
                .from('note_items')
                .update({ title: newTitle, content: newContent, note_id: newFolderId })
                .eq('id', itemId)
                .select('*, notes(id, title)') // Ambil data baru setelah update
                .single();
                
            if (error) throw error;
            
            alert("Item berhasil diperbarui!");
            setItem(data); // Perbarui state item di halaman ini dengan data baru

            // Jika item dipindah, arahkan pengguna kembali ke daftar folder baru
            if (item.note_id !== newFolderId) {
                navigate(`/note-collection/${newFolderId}`);
            }

        } catch (err) {
            alert("Gagal memperbarui item: " + err.message);
        }
    };

    if (loading) return <div className="p-8 dark:text-gray-300 text-center">Memuat catatan...</div>;
    if (!item) return <div className="p-8 dark:text-gray-400 text-center">Catatan tidak ditemukan atau gagal dimuat.</div>;

    const parentFolder = item.notes;

    return (
        <>
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                {parentFolder && (
                     <button 
                        onClick={() => navigate(`/note-collection/${parentFolder.id}`)} 
                        className="mb-6 text-sm text-blue-500 hover:underline"
                    >
                        &larr; Kembali ke folder "{parentFolder.title}"
                    </button>
                )}

                <div className="mb-4">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white break-words">
                        {item.title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Dibuat: {new Date(item.created_at).toLocaleString()}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    <button 
                        onClick={() => setIsModalOpen(true)} // Mengubah onClick untuk membuka modal
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Edit Catatan Ini
                    </button>
                </div>
                
                <div 
                    className="prose dark:prose-invert max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                />
            </div>

            {/* Render modal edit di sini */}
            <NoteItemEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={item}
                onSave={handleUpdateItem}
                folders={allFolders}
            />
        </>
    );
}

export default NoteViewPage;
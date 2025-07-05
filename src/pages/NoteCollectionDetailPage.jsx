import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function NoteCollectionDetailPage({ session }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [parentNote, setParentNote] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            setLoading(true);
            try {
                const [parentNoteRes, itemsRes] = await Promise.all([
                    supabase.from('notes').select('id, title, description').eq('id', id).single(),
                    supabase.from('note_items').select('id, title, created_at').eq('note_id', id).order('created_at', { ascending: false })
                ]);

                if (parentNoteRes.error) throw parentNoteRes.error;
                if (itemsRes.error) throw itemsRes.error;

                setParentNote(parentNoteRes.data);
                setItems(itemsRes.data);
            } catch (err) {
                setError('Gagal memuat data: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleDeleteFolder = async () => {
        const confirmText = window.prompt(`Anda akan menghapus SELURUH folder catatan "${parentNote.title}" dan semua isinya. Ini tidak bisa diurungkan. Ketik 'HAPUS'.`);
        if (confirmText === "HAPUS") {
            try {
                // Hapus semua item terlebih dahulu
                const { error: deleteItemsError } = await supabase.from('note_items').delete().eq('note_id', id);
                if (deleteItemsError) throw deleteItemsError;

                // Hapus folder
                const { error: deleteFolderError } = await supabase.from('notes').delete().eq('id', id);
                if (deleteFolderError) throw deleteFolderError;

                alert(`Folder catatan "${parentNote.title}" berhasil dihapus.`);
                navigate('/notes'); // Kembali ke daftar folder
            } catch (error) {
                alert("Gagal menghapus folder catatan: " + error.message);
            }
        }
    };


    if (loading) return <div className="p-6 text-center">Memuat...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;
    if (!parentNote) return <div className="p-6 text-center">Folder tidak ditemukan.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <button onClick={() => navigate('/notes')} className="mb-6 text-sm text-blue-500 hover:underline">
                &larr; Kembali ke Daftar Semua Folder
            </button>

            {/* --- Bagian Detail Folder --- */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold dark:text-white">{parentNote.title}</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{parentNote.description}</p>
                <div className="mt-4">
                     <button onClick={handleDeleteFolder} className="text-sm text-red-500 hover:underline">
                        Hapus Folder Ini
                    </button>
                </div>
            </div>

            {/* --- Bagian Daftar Judul Catatan --- */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 dark:text-white border-t pt-6 dark:border-gray-700">Daftar Catatan</h2>
                <div className="space-y-1">
                    {items.length > 0 ? (
                        items.map(item => (
                            <Link 
                                to={`/note/${item.id}`} 
                                key={item.id} 
                                className="block p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400">{item.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Dibuat: {new Date(item.created_at).toLocaleDateString()}</p>
                            </Link>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8">Belum ada catatan di dalam folder ini.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NoteCollectionDetailPage;
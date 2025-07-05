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

    // State untuk mode edit folder
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

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

                const folderData = parentNoteRes.data;
                setParentNote(folderData);
                setItems(itemsRes.data);

                // Inisialisasi state untuk form edit
                setEditTitle(folderData.title);
                setEditDescription(folderData.description || '');

            } catch (err) {
                setError('Gagal memuat data: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);
    
    // Fungsi untuk menyimpan perubahan pada folder
    const handleUpdateFolder = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('notes')
                .update({ title: editTitle, description: editDescription })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            
            setParentNote(data); // Perbarui tampilan dengan data baru
            setIsEditing(false); // Keluar dari mode edit
            alert('Folder berhasil diperbarui!');
        } catch (error) {
            alert('Gagal memperbarui folder: ' + error.message);
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

            {/* --- Bagian Detail Folder (Bisa Edit) --- */}
            <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                {!isEditing ? (
                    <div>
                        <h1 className="text-4xl font-bold dark:text-white">{parentNote.title}</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{parentNote.description}</p>
                        <div className="text-right mt-4">
                            <button onClick={() => setIsEditing(true)} className="text-sm text-blue-500 hover:underline font-semibold">
                                Edit Detail Folder
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdateFolder} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Judul Folder</label>
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Deskripsi</label>
                            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows="3" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"></textarea>
                        </div>
                        <div className="flex gap-4">
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md">Simpan</button>
                            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Batal</button>
                        </div>
                    </form>
                )}
            </div>

            {/* --- Bagian Daftar Judul Catatan --- */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 dark:text-white">Daftar Catatan</h2>
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
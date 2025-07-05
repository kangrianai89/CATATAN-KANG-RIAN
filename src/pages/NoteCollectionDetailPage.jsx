import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from '../components/MenuBar';

// --- Ikon ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

// --- Komponen Modal Baru untuk Tambah Catatan ---
function AddNoteItemModal({ isOpen, onClose, parentNoteId, user, onItemAdded }) {
    const [title, setTitle] = useState('');
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

    useEffect(() => {
        // Reset editor saat modal ditutup/dibuka
        if (editor && !isOpen) {
            editor.commands.clearContent();
            setTitle('');
        }
    }, [isOpen, editor]);
    
    const handleSave = async () => {
        if (!title.trim()) {
            alert('Judul catatan tidak boleh kosong.');
            return;
        }
        setIsSaving(true);
        const content = editor.getHTML();

        try {
            const { data, error } = await supabase
                .from('note_items')
                .insert({ title, content, note_id: parentNoteId, user_id: user.id })
                .select()
                .single();
            if (error) throw error;
            alert('Catatan baru berhasil disimpan!');
            onItemAdded(data);
            onClose();
        } catch (err) {
            alert('Gagal menyimpan catatan: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Buat Catatan Baru</h2>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Judul Catatan</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Konten</label>
                        <div className="border rounded-lg dark:border-gray-600">
                            <MenuBar editor={editor} />
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Batal</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Komponen Halaman Utama ---
function NoteCollectionDetailPage({ session }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [parentNote, setParentNote] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false); // State untuk modal tambah
    const user = session?.user;

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
    
    if (loading) return <div className="p-6 text-center">Memuat...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;
    if (!parentNote) return <div className="p-6 text-center">Folder tidak ditemukan.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <button onClick={() => navigate('/notes')} className="mb-6 text-sm text-blue-500 hover:underline flex items-center gap-2">
                <BackIcon /> Kembali ke Daftar Folder
            </button>

            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                 <div className="flex justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold dark:text-white">{parentNote.title}</h1>
                        {parentNote.description && <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{parentNote.description}</p>}
                    </div>
                    <button onClick={() => setIsAddItemModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700">
                        <PlusIcon/> Tambah Catatan
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4 dark:text-white">Daftar Catatan</h2>
                <div className="space-y-2">
                    {items.length > 0 ? (
                        items.map(item => (
                            <Link to={`/note/${item.id}`} key={item.id} className="block p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400">{item.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Dibuat: {new Date(item.created_at).toLocaleDateString()}</p>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <p>Belum ada catatan di dalam folder ini.</p>
                            <button onClick={() => setIsAddItemModalOpen(true)} className="mt-2 text-sm text-blue-500 hover:underline">Buat catatan pertama Anda</button>
                        </div>
                    )}
                </div>
            </div>

            <AddNoteItemModal
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                parentNoteId={id}
                user={user}
                onItemAdded={(newItem) => setItems(prevItems => [newItem, ...prevItems])}
            />
        </div>
    );
}

export default NoteCollectionDetailPage;
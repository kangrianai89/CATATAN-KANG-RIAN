import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import FolderManagementModal from '../components/FolderManagementModal';
import QuickAddItemModal from '../components/QuickAddItemModal';

// --- Ikon ---
const PinIcon = ({ isPinned }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> );
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

// --- Kartu Folder ---
const FolderCard = ({note, onDelete, onTogglePin}) => {
    const navigate = useNavigate();
    return (
        <li className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${note.pinned ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
            <Link to={`/note-collection/${note.id}`} className="flex-grow min-w-0 mr-0 sm:mr-4 w-full">
                <div className="flex items-center gap-2 mb-1">
                    {note.pinned && <PinIcon isPinned={true} />}
                    <h3 className="font-bold text-lg dark:text-white truncate">{note.title}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 truncate">{note.description || 'Tidak ada deskripsi'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat: {new Date(note.created_at).toLocaleDateString()}</p>
            </Link>
            <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                <button onClick={() => navigate(`/note-collection/${note.id}`)} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white">Lihat/Edit</button>
                <button onClick={() => onTogglePin(note.id, note.pinned)} title={note.pinned ? 'Lepas Sematan' : 'Sematkan'} className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 ${ note.pinned ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500' }`}><PinIcon isPinned={note.pinned} /></button>
                <button onClick={() => onDelete(note.id, note.title)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon /></button>
            </div>
        </li>
    );
};

// --- Komponen Halaman Utama ---
function NotesPage({ session }) { 
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const user = session?.user;

    useEffect(() => {
        async function fetchFolders() {
            if (!user) { setLoading(false); return; }
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select(`id, title, description, created_at, pinned`)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                setNotes(data || []);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchFolders();
    }, [user]);

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }, [notes]);

    const handleDeleteFolder = async (noteId, noteTitle) => { 
        const confirmationText = window.prompt(`Anda akan menghapus SELURUH folder catatan "${noteTitle}" dan semua isinya. Ketik 'HAPUS'.`);
        if (confirmationText === "HAPUS") {
            try {
                const { error } = await supabase.from('notes').delete().eq('id', noteId);
                if (error) throw error;
                setNotes(notes.filter((note) => note.id !== noteId));
                alert(`Folder catatan "${noteTitle}" berhasil dihapus.`);
            } catch (error) {
                alert("Gagal menghapus folder catatan: " + error.message);
            }
        }
    };

    const handleTogglePin = async (noteId, currentStatus) => { 
        try {
            const { data, error } = await supabase.from('notes').update({ pinned: !currentStatus }).eq('id', noteId).select().single();
            if (error) throw error;
            setNotes(prevNotes => prevNotes.map(n => n.id === noteId ? data : n));
        } catch (error) {
            alert('Gagal memperbarui pin: ' + error.message);
        }
    };
    
    const handleFolderCreated = (newFolder) => {
        setNotes(prev => [newFolder, ...prev]);
    };

    const handleItemAdded = (newItem) => {
        console.log('Item baru ditambahkan:', newItem);
    };
    
    if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat...</div>;
    
    return (
    <>
        {/* --- PERUBAHAN DI SINI --- */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold dark:text-white">Folder Catatan</h1>
                <p className="text-gray-600 dark:text-gray-400">Buat folder untuk mengelompokkan catatan Anda.</p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
                 <button 
                    onClick={() => setIsFolderModalOpen(true)}
                    className="px-3 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition-colors text-sm"
                >
                    + Buat Folder
                </button>
                <button 
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors"
                >
                    + Tambah Catatan
                </button>
            </div>
        </div>

        <ul className="space-y-4">
            {sortedNotes.length > 0 ? (
                sortedNotes.map(note => (
                    <FolderCard 
                        key={note.id} 
                        note={note} 
                        onDelete={handleDeleteFolder} 
                        onTogglePin={handleTogglePin}
                    />
                ))
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-10">Belum ada folder. Silakan buat folder pertama Anda.</p>
            )}
        </ul>

        <QuickAddItemModal
            isOpen={isAddItemModalOpen}
            onClose={() => setIsAddItemModalOpen(false)}
            folders={notes}
            user={user}
            onItemAdded={handleItemAdded}
        />
        
        <FolderManagementModal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
            onFolderCreated={handleFolderCreated}
            user={user}
        />
    </>
    );
}

export default NotesPage;
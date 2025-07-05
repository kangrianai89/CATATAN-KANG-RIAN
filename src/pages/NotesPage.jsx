import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import FolderManagementModal from '../components/FolderManagementModal';

// --- Ikon ---
const PinIcon = ({ isPinned }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> );
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 11.5-11.5z"/></svg>;
const MoreVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;


// --- Kartu Folder ---
const FolderCard = ({ note, onDelete, onTogglePin }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    const handleAction = (action) => {
        action();
        setIsMenuOpen(false);
    };

    return (
        <li className={`group relative flex flex-col p-4 border rounded-lg shadow-sm transition-colors ${note.pinned ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
            <Link to={`/note-collection/${note.id}`} className="flex-grow min-w-0 w-full">
                <div className="flex items-center gap-2 mb-1">
                    {note.pinned && <PinIcon isPinned={true} />}
                    <h3 className="font-bold text-lg dark:text-white truncate group-hover:text-purple-600">{note.title}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 truncate">{note.description || 'Tidak ada deskripsi'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat: {new Date(note.created_at).toLocaleDateString()}</p>
            </Link>
            
            <div ref={menuRef} className="absolute top-2 right-2">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity">
                    <MoreVerticalIcon />
                </button>
                {isMenuOpen && (
                     <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border dark:border-gray-700">
                        <ul className="py-1">
                            <li><button onClick={() => handleAction(() => navigate(`/note-collection/${note.id}`))} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><EditIcon /> Lihat / Edit Isi</button></li>
                            <li><button onClick={() => handleAction(() => onTogglePin(note.id, note.pinned))} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><PinIcon isPinned={note.pinned} /> {note.pinned ? 'Lepas Sematan' : 'Sematkan'}</button></li>
                            <li><button onClick={() => handleAction(() => onDelete(note.id, note.title))} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"><TrashIcon /> Hapus Folder</button></li>
                        </ul>
                    </div>
                )}
            </div>
        </li>
    );
};

// --- Komponen Halaman Utama ---
function NotesPage({ session }) { 
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    // const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false); // Dihapus
    const user = session?.user;

    useEffect(() => {
        async function fetchFolders() {
            if (!user?.id) { setLoading(false); return; }
            setLoading(true);
            try {
                const { data, error } = await supabase.from('notes').select(`id, title, description, created_at, pinned`).order('created_at', { ascending: false });
                if (error) throw error;
                setNotes(data || []);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchFolders();
    }, [user?.id]);

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }, [notes]);

    const handleDeleteFolder = async (noteId, noteTitle) => { 
        if (window.prompt(`Ketik 'HAPUS' untuk menghapus folder "${noteTitle}".`) === "HAPUS") {
            try {
                await supabase.from('notes').delete().eq('id', noteId);
                setNotes(notes.filter((note) => note.id !== noteId));
            } catch (error) {
                alert("Gagal menghapus folder: " + error.message);
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

    if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat...</div>;
    
    return (
    <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold dark:text-white">Folder Catatan</h1>
                <p className="text-gray-600 dark:text-gray-400">Buat folder untuk mengelompokkan catatan Anda.</p>
            </div>
            {/* Tombol "+ Tambah Catatan" dihapus dari sini */}
            <div className="flex flex-shrink-0">
                 <button onClick={() => setIsFolderModalOpen(true)} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors">
                    + Buat Folder
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
                <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                     <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Anda Belum Punya Folder</h3>
                    <p className="mt-2 text-gray-500">Mulai buat folder pertama Anda untuk menyimpan catatan.</p>
                </div>
            )}
        </ul>

        {/* <QuickAddItemModal ... /> Dihapus dari sini */}
        
        <FolderManagementModal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
            onFolderCreated={handleFolderCreated}
            user={user}
        />
    </div>
    );
}

export default NotesPage;
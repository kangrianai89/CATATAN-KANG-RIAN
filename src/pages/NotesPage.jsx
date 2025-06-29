import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from '../components/MenuBar';

const PinIcon = ({ isPinned }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> );
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const ChevronIcon = ({ isOpen }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}><polyline points="9 18 15 12 9 6"></polyline></svg> );

const NoteParentCard = ({note, onDelete, onTogglePin}) => {
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

function NotesPage({ session }) { 
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [openCategories, setOpenCategories] = useState({});
    const user = session?.user;

    const [formMode, setFormMode] = useState('addFolder');
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [newFolderDesc, setNewFolderDesc] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [newItemTitle, setNewItemTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    
    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: { class: 'prose dark:prose-invert max-w-none p-4 min-h-[150px] focus:outline-none' },
        },
    });

    const toggleCategory = (categoryId) => {
        setOpenCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const parentCategories = useMemo(() => categories.filter(cat => !cat.parent_id).sort((a,b) => a.name.localeCompare(b.name)), [categories]);
    const subCategoriesByParent = useMemo(() => {
        const grouped = {};
        parentCategories.forEach(pCat => {
            grouped[pCat.id] = categories.filter(cat => cat.parent_id === pCat.id).sort((a,b) => a.name.localeCompare(b.name));
        });
        return grouped;
    }, [categories, parentCategories]);
    
    const parentNotesBySubCategory = useMemo(() => {
        const grouped = {};
        notes.forEach(note => {
            const key = note.category_id || 'uncategorized';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(note);
        });
        for (const subCatId in grouped) {
            grouped[subCatId].sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
        }
        return grouped;
    }, [notes]);
    
    useEffect(() => {
        async function fetchData() {
            if (!user) { setLoading(false); return; }
            setLoading(true);
            try {
                const [notesRes, categoriesRes] = await Promise.all([
                    supabase.from('notes').select(`id, title, description, created_at, pinned, category_id`),
                    supabase.from('categories').select(`id, name, parent_id`)
                ]);
                if (notesRes.error) throw notesRes.error;
                if (categoriesRes.error) throw categoriesRes.error;
                
                const sortedNotes = (notesRes.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setNotes(sortedNotes);
                setCategories(categoriesRes.data || []);
                
                if (sortedNotes.length > 0 && !selectedFolder) {
                    setSelectedFolder(sortedNotes[0].id);
                }

            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderTitle || !selectedSubCategory) {
            alert("Judul Folder dan Sub-Kategori harus diisi!");
            return;
        }
        try {
            const { data, error } = await supabase.from('notes').insert({ 
                title: newFolderTitle,
                description: newFolderDesc,
                user_id: user.id,
                category_id: selectedSubCategory
            }).select().single();
            if (error) throw error;
            setNotes(prev => [data, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setNewFolderTitle('');
            setNewFolderDesc('');
            alert('Folder Catatan berhasil dibuat!');
        } catch (error) {
            alert("Gagal membuat folder: " + error.message);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        const content = editor.getHTML();
        if (!newItemTitle.trim() || content === '<p></p>' || !selectedFolder) {
            alert("Judul Item, Konten, dan pilihan Folder harus diisi!");
            return;
        }
        try {
            await supabase.from('note_items').insert({
                note_id: selectedFolder,
                user_id: user.id,
                title: newItemTitle,
                content: content
            });
            setNewItemTitle('');
            editor.commands.clearContent();
            alert(`Item berhasil ditambahkan ke folder! Anda akan diarahkan ke sana.`);
            navigate(`/note-collection/${selectedFolder}`);
        } catch (err) {
            alert('Gagal menambah item: ' + err.message);
        }
    };
    
    const handleDeleteParentNote = async (noteId, noteTitle) => { 
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
            await supabase.from('notes').update({ pinned: !currentStatus }).eq('id', noteId);
            setNotes(prevNotes => prevNotes.map(n => n.id === noteId ? { ...n, pinned: !currentStatus } : n));
        } catch (error) {
            alert('Gagal memperbarui pin: ' + error.message);
        }
    };
    
    const handleDeleteCategory = async (categoryToDelete) => { 
        const confirmText = window.prompt(`Menghapus kategori "${categoryToDelete.name}" akan membuat folder catatan terkait tidak terkategori. Ketik 'HAPUS' untuk konfirmasi.`);
        if(confirmText === "HAPUS"){
            try {
                const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id);
                if (error) throw error;
                setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
            } catch(err) {
                alert(`Gagal menghapus kategori: ${err.message}`);
            }
        }
    };
    
    if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat...</div>;
    
    return (
    <>
        <div className="mb-8">
            <h1 className="text-3xl font-bold dark:text-white">Folder Catatan</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola semua folder dan item catatan Anda dari sini.</p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
            <div className="flex border-b dark:border-gray-700 mb-4">
                <button onClick={() => setFormMode('addFolder')} className={`py-2 px-4 -mb-px border-b-2 font-semibold ${formMode === 'addFolder' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'}`}>
                    Buat Folder Baru
                </button>
                <button onClick={() => setFormMode('addItem')} className={`py-2 px-4 -mb-px border-b-2 font-semibold ${formMode === 'addItem' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'}`}>
                    Tambah Item Cepat
                </button>
            </div>

            {formMode === 'addFolder' ? (
                <form onSubmit={handleCreateFolder} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Judul Folder</label>
                        <input type="text" value={newFolderTitle} onChange={e => setNewFolderTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                        <input type="text" value={newFolderDesc} onChange={e => setNewFolderDesc(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Masukkan ke Sub-Kategori</label>
                        <select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required>
                            <option value="" disabled>-- Pilih Sub-Kategori --</option>
                            {parentCategories.map(pCat => (
                                <optgroup key={pCat.id} label={pCat.name}>
                                    {(subCategoriesByParent[pCat.id] || []).map(sCat => (<option key={sCat.id} value={sCat.id}>{sCat.name}</option>))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700">Simpan Folder Baru</button>
                </form>
            ) : (
                <form onSubmit={handleAddItem} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">Tambah ke Folder</label>
                        <select value={selectedFolder} onChange={e => setSelectedFolder(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required>
                            <option value="" disabled>-- Pilih Folder --</option>
                            {notes.map(note => (<option key={note.id} value={note.id}>{note.title}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Judul Item</label>
                        <input type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Konten</label>
                        <div className="border rounded-lg dark:border-gray-600">
                           <MenuBar editor={editor} />
                           <EditorContent editor={editor} />
                        </div>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Simpan Item Baru</button>
                </form>
            )}
        </div>

        <div className="space-y-4">
            {parentCategories.map(pCat => (
                <div key={pCat.id} className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <button onClick={() => toggleCategory(pCat.id)} className="flex items-center gap-3 w-full text-left p-1 -m-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                           <ChevronIcon isOpen={openCategories[pCat.id]} />
                           <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{pCat.name}</span>
                        </button>
                        <button onClick={() => handleDeleteCategory(pCat)} className="flex-shrink-0 ml-4 p-2 text-red-500 hover:text-red-700 opacity-50 hover:opacity-100" title={`Hapus Kategori Induk "${pCat.name}"`}><TrashIcon/></button>
                    </div>
                    
                    {openCategories[pCat.id] && (
                        <div className="pl-4 pt-4 mt-4 space-y-5 border-l-2 border-purple-200 dark:border-purple-800 ml-2.5">
                            {(subCategoriesByParent[pCat.id] || []).map(sCat => (
                                <div key={sCat.id}>
                                    <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{sCat.name}</h3>
                                        <button onClick={() => handleDeleteCategory(sCat)} className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100 transition-opacity" title={`Hapus Sub-Kategori "${sCat.name}"`}><TrashIcon/></button>
                                    </div>
                                    <ul className="mt-4 space-y-4">
                                        {(parentNotesBySubCategory[sCat.id] || []).map(note => <NoteParentCard key={note.id} note={note} onDelete={handleDeleteParentNote} onTogglePin={handleTogglePin}/>)}
                                    </ul>
                                    {!(parentNotesBySubCategory[sCat.id] || []).length && (<p className="mt-3 text-sm text-gray-500 italic">Belum ada folder catatan di sub-kategori ini.</p>)}
                                </div>
                            ))}
                            {!(subCategoriesByParent[pCat.id] || []).length && <p className="mt-4 text-sm text-gray-500 italic">Belum ada sub-kategori di sini.</p>}
                        </div>
                    )}
                </div>
            ))}

            {(parentNotesBySubCategory['uncategorized'] || []).length > 0 && (
                 <div className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">Tidak Terkategori</h2>
                     <ul className="mt-4 space-y-4">
                        {(parentNotesBySubCategory['uncategorized']).map(note => <NoteParentCard key={note.id} note={note} onDelete={handleDeleteParentNote} onTogglePin={handleTogglePin}/>)}
                    </ul>
                 </div>
            )}
        </div>
    </>
    );
}

export default NotesPage;
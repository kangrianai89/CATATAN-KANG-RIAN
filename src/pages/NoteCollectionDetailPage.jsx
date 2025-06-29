// src/pages/NoteCollectionDetailPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import NoteItemEditModal from '../components/NoteItemEditModal';
import MenuBar from '../components/MenuBar'; // <-- Impor MenuBar terpusat

function NoteCollectionDetailPage({ session }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [parentNote, setParentNote] = useState(null);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [newItemTitle, setNewItemTitle] = useState('');
    const user = session?.user;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: { class: 'prose dark:prose-invert max-w-none p-4 min-h-[150px] focus:outline-none' },
        },
    });

    const parentCategories = useMemo(() => categories.filter(cat => !cat.parent_id).sort((a,b) => a.name.localeCompare(b.name)), [categories]);
    const subCategoriesByParent = useMemo(() => {
        const grouped = {};
        parentCategories.forEach(pCat => {
            grouped[pCat.id] = categories.filter(cat => cat.parent_id === pCat.id).sort((a,b) => a.name.localeCompare(b.name));
        });
        return grouped;
    }, [categories, parentCategories]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                if (!user || !id) return;
                const [parentNoteRes, itemsRes, categoriesRes] = await Promise.all([
                    supabase.from('notes').select('*, categories(name)').eq('id', id).single(),
                    supabase.from('note_items').select('*').eq('note_id', id).order('created_at', { ascending: true }),
                    supabase.from('categories').select('id, name, parent_id').order('name')
                ]);
                if (parentNoteRes.error) throw parentNoteRes.error;
                if (itemsRes.error) throw itemsRes.error;
                if (categoriesRes.error) throw categoriesRes.error;
                setParentNote(parentNoteRes.data);
                setItems(itemsRes.data);
                setCategories(categoriesRes.data);
                setEditTitle(parentNoteRes.data.title);
                setEditDescription(parentNoteRes.data.description || '');
                setEditCategoryId(parentNoteRes.data.category_id || '');
            } catch (err) {
                setError('Gagal memuat data: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, user]);

    const handleUpdateParentNote = async (e) => {
        e.preventDefault();
        try {
            const categoryToSave = editCategoryId === '' ? null : editCategoryId;
            const { data, error } = await supabase.from('notes').update({
                title: editTitle,
                description: editDescription,
                category_id: categoryToSave
            }).eq('id', id).select('*, categories(name)').single();
            if (error) throw error;
            setParentNote(data);
            setIsEditing(false);
            alert('Folder catatan berhasil diperbarui!');
        } catch (err) {
            alert('Gagal memperbarui: ' + err.message);
        }
    };
    
    const handleAddItem = async (e) => {
        e.preventDefault();
        const content = editor.getHTML();
        if (!newItemTitle.trim() || content === '<p></p>') {
            alert("Judul dan Konten item tidak boleh kosong!");
            return;
        }
        try {
            const { data, error } = await supabase.from('note_items').insert({
                note_id: id, user_id: user.id, title: newItemTitle, content: content
            }).select().single();
            if (error) throw error;
            setItems(prev => [...prev, data]);
            setNewItemTitle('');
            editor.commands.clearContent();
            alert('Item baru berhasil ditambahkan!');
        } catch (err) {
            alert('Gagal menambah item: ' + err.message);
        }
    };

    const handleDeleteItem = async (itemId) => {
        const confirmText = window.prompt("Ketik 'HAPUS' untuk menghapus item ini.");
        if (confirmText === 'HAPUS') {
            try {
                const { error } = await supabase.from('note_items').delete().eq('id', itemId);
                if (error) throw error;
                setItems(prev => prev.filter(item => item.id !== itemId));
            } catch (err) {
                alert('Gagal menghapus item: ' + err.message);
            }
        }
    };

    const handleOpenEditModal = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleUpdateItem = async (itemId, newTitle, newContent) => {
        try {
            const { data, error } = await supabase.from('note_items').update({ title: newTitle, content: newContent }).eq('id', itemId).select().single();
            if (error) throw error;
            setItems(prevItems => prevItems.map(item => (item.id === itemId ? data : item)));
            alert("Item berhasil diperbarui!");
        } catch (err) {
            alert("Gagal memperbarui item: " + err.message);
        }
    };

    if (loading) return <div className="p-6 text-center">Memuat...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <>
            <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* ... (Bagian Header & Form Edit sama, tidak berubah) ... */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                         <button onClick={() => navigate('/notes')} className="mb-4 text-sm text-blue-500 hover:underline">&larr; Kembali ke Daftar Folder</button>
                         {!isEditing ? (
                             <>
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <h1 className="text-3xl font-bold dark:text-white">{parentNote.title}</h1>
                                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kategori: {parentNote.categories ? parentNote.categories.name : 'Tidak ada'}</p>
                                         <p className="mt-2 text-gray-700 dark:text-gray-300">{parentNote.description}</p>
                                     </div>
                                     <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Edit</button>
                                 </div>
                             </>
                         ) : (
                             <form onSubmit={handleUpdateParentNote} className="space-y-4">
                                 <h2 className="text-2xl font-semibold dark:text-white">Edit Detail Folder</h2>
                                 <div>
                                     <label className="block text-sm font-medium mb-1">Judul Folder</label>
                                     <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium mb-1">Deskripsi</label>
                                     <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows="3" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium mb-1">Kategori</label>
                                     <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                         <option value="">-- Tanpa Kategori --</option>
                                         {parentCategories.map(pCat => (
                                             <optgroup key={pCat.id} label={pCat.name}>
                                                 {(subCategoriesByParent[pCat.id] || []).map(sCat => (<option key={sCat.id} value={sCat.id}>{sCat.name}</option>))}
                                             </optgroup>
                                         ))}
                                     </select>
                                 </div>
                                 <div className="flex gap-4">
                                     <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md">Simpan</button>
                                     <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-300 text-black rounded-md">Batal</button>
                                 </div>
                             </form>
                         )}
                     </div>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h2 className="text-2xl font-semibold mb-4 dark:text-white">Item Catatan</h2>
                        <div className="space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="p-4 border dark:border-gray-700 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold dark:text-white">{item.title}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenEditModal(item)} className="text-blue-500 text-sm font-medium">Edit</button>
                                            <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 text-sm font-medium">Hapus</button>
                                        </div>
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none mt-2" dangerouslySetInnerHTML={{ __html: item.content }} />
                                </div>
                            ))}
                            {items.length === 0 && <p className="text-center text-gray-500 py-4">Belum ada item di folder ini.</p>}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                         <h2 className="text-2xl font-semibold mb-4 dark:text-white">Tambah Item Catatan Baru</h2>
                         <form onSubmit={handleAddItem} className="space-y-4">
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
                            <button type="submit" className="w-full px-6 py-3 bg-purple-600 text-white rounded-md">Tambah Item</button>
                         </form>
                    </div>
                </div>
            </div>
            <NoteItemEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} item={editingItem} onSave={handleUpdateItem} />
        </>
    );
}

export default NoteCollectionDetailPage;
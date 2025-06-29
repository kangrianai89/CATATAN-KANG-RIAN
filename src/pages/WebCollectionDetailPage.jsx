import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function WebCollectionDetailPage({ session }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState(null);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingCollection, setIsEditingCollection] = useState(false);
    
    // State untuk form edit koleksi
    const [editCollectionTitle, setEditCollectionTitle] = useState('');
    const [editCollectionDescription, setEditCollectionDescription] = useState('');
    const [editCollectionCategory, setEditCollectionCategory] = useState('');

    // State untuk form tambah item (selalu ada)
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');

    const user = session?.user;
    const DRAFT_KEY = `web-collection-draft-${id}`;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                if (!user || !id) return;

                // Ambil semua data secara paralel
                const [collectionRes, categoriesRes, itemsRes] = await Promise.all([
                    supabase.from('web_collections').select(`*, web_categories (name)`).eq('id', id).eq('user_id', user.id).single(),
                    supabase.from('web_categories').select('*').eq('user_id', user.id),
                    supabase.from('web_items').select('*').eq('collection_id', id).order('created_at', { ascending: true })
                ]);

                // Handle error koleksi
                if (collectionRes.error) {
                    if (collectionRes.error.code === 'PGRST116') setError("Koleksi tidak ditemukan atau Anda tidak memiliki akses.");
                    else throw collectionRes.error;
                } else {
                    const collectionData = collectionRes.data;
                    setCollection(collectionData);
                    // Set state edit dari data yang baru diambil atau dari draf
                    const savedDraft = sessionStorage.getItem(DRAFT_KEY);
                    if (savedDraft) {
                        console.log("Memuat draf dari session storage...");
                        const draft = JSON.parse(savedDraft);
                        setEditCollectionTitle(draft.title);
                        setEditCollectionDescription(draft.description);
                        setEditCollectionCategory(draft.categoryId);
                    } else {
                        setEditCollectionTitle(collectionData.title);
                        setEditCollectionDescription(collectionData.description || '');
                        setEditCollectionCategory(collectionData.category_id || '');
                    }
                }

                // Handle error lain
                if (categoriesRes.error) throw categoriesRes.error;
                if (itemsRes.error) throw itemsRes.error;
                
                setCategories(categoriesRes.data || []);
                setItems(itemsRes.data || []);

            } catch (err) {
                console.error("Error fetching data:", err.message);
                setError("Gagal memuat data: " + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, user]);

    useEffect(() => {
        if (isEditingCollection) {
            const draft = {
                title: editCollectionTitle,
                description: editCollectionDescription,
                categoryId: editCollectionCategory
            };
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        }
    }, [editCollectionTitle, editCollectionDescription, editCollectionCategory, isEditingCollection, DRAFT_KEY]);

    const handleUpdateCollection = async (e) => {
        e.preventDefault();
        if (!editCollectionTitle || !editCollectionCategory) {
            alert("Judul dan Kategori Koleksi tidak boleh kosong!");
            return;
        }
        try {
            const { data, error: updateError } = await supabase
                .from('web_collections')
                .update({ title: editCollectionTitle, description: editCollectionDescription, category_id: editCollectionCategory })
                .eq('id', id)
                .select(`*, web_categories (name)`)
                .single();
            if (updateError) throw updateError;
            
            setCollection(data);
            setIsEditingCollection(false);
            sessionStorage.removeItem(DRAFT_KEY);
            alert('Koleksi berhasil diperbarui!');
        } catch (err) {
            console.error("Error updating collection:", err.message);
            setError("Gagal memperbarui koleksi: " + err.message);
        }
    };
    
    const handleCancelEdit = () => {
        setIsEditingCollection(false);
        sessionStorage.removeItem(DRAFT_KEY);
        setEditCollectionTitle(collection.title);
        setEditCollectionDescription(collection.description || '');
        setEditCollectionCategory(collection.category_id || '');
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItemTitle.trim() || !newItemUrl.trim()) {
            alert("Judul dan URL item tidak boleh kosong!");
            return;
        }
        try {
            const { data, error } = await supabase
                .from('web_items')
                .insert({
                    collection_id: id,
                    user_id: user.id,
                    title: newItemTitle,
                    url: newItemUrl,
                    description: newItemDescription
                })
                .select()
                .single();

            if (error) throw error;

            setItems(prevItems => [...prevItems, data]);
            setNewItemTitle('');
            setNewItemUrl('');
            setNewItemDescription('');
            alert("Item baru berhasil ditambahkan!");
        } catch (err) {
            console.error("Error adding item:", err.message);
            setError("Gagal menambahkan item: " + err.message);
        }
    };

    const handleDeleteItem = async (itemToDelete) => {
        const confirmText = window.prompt(`Anda akan menghapus item "${itemToDelete.title}". Aksi ini permanen.\n\nUntuk konfirmasi, ketik 'HAPUS' di bawah ini.`);
        if (confirmText === "HAPUS") {
            try {
                const { error } = await supabase
                    .from('web_items')
                    .delete()
                    .eq('id', itemToDelete.id);
                
                if (error) throw error;
                
                setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
                alert("Item berhasil dihapus.");
            } catch (err) {
                console.error("Error deleting item:", err.message);
                setError("Gagal menghapus item: " + err.message);
            }
        } else if (confirmText !== null) {
            alert("Penghapusan dibatalkan.");
        }
    };

    if (loading) return <div className="p-6 text-center">Memuat detail koleksi...</div>;
    if (error) return <div className="p-6 text-red-500">Terjadi kesalahan: {error}</div>;
    if (!collection) return <div className="p-6 text-center text-gray-600 dark:text-gray-400">Koleksi tidak ditemukan.</div>;

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-4xl mx-auto">
                <button onClick={() => navigate('/web-collections')} className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>
                    Kembali ke Daftar Koleksi
                </button>
                
                {/* --- BAGIAN HEADER (BISA VIEW / EDIT) --- */}
                {!isEditingCollection ? (
                    <div className="pb-6 border-b dark:border-gray-700">
                        <div className="flex justify-between items-start">
                             <div>
                                <h1 className="text-3xl font-bold mb-2">{collection.title}</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Kategori: <span className="font-medium">{collection.web_categories ? collection.web_categories.name : 'Tidak Terkategori'}</span>
                                </p>
                                {collection.description && (<p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{collection.description}</p>)}
                            </div>
                            <button onClick={() => setIsEditingCollection(true)} className="flex-shrink-0 ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors">Edit Detail</button>
                        </div>
                    </div>
                ) : (
                    <div className="pb-6 border-b dark:border-gray-700">
                        <form onSubmit={handleUpdateCollection} className="space-y-4">
                            <h2 className="text-2xl font-bold mb-4">Edit Detail Koleksi</h2>
                            {/* Form inputs... */}
                            <div>
                                <label htmlFor="editCollectionTitle" className="block text-sm font-medium mb-1">Judul Koleksi</label>
                                <input type="text" id="editCollectionTitle" value={editCollectionTitle} onChange={(e) => setEditCollectionTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                            <div>
                                <label htmlFor="editCollectionDescription" className="block text-sm font-medium mb-1">Deskripsi Koleksi (Opsional)</label>
                                <textarea id="editCollectionDescription" value={editCollectionDescription} onChange={(e) => setEditCollectionDescription(e.target.value)} rows="3" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
                            </div>
                            <div>
                                <label htmlFor="editCollectionCategory" className="block text-sm font-medium mb-1">Kategori Koleksi</label>
                                 <select id="editCollectionCategory" value={editCollectionCategory} onChange={(e) => setEditCollectionCategory(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required>
                                    <option value="" disabled>Pilih Kategori</option>
                                    {/* Di sini kita perlu logic untuk optgroup jika ada parent-child category */}
                                    {categories.filter(c => c.parent_id).map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors">Simpan Perubahan</button>
                                <button type="button" onClick={handleCancelEdit} className="flex-1 px-6 py-2 bg-gray-400 hover:bg-gray-500 text-gray-800 font-medium rounded-md transition-colors">Batal</button>
                            </div>
                        </form>
                    </div>
                )}
                
                {/* --- BAGIAN TAMBAH ITEM & DAFTAR ITEM (SELALU TAMPIL) --- */}
                <div className="pt-6">
                     <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Tambah Item Baru</h2>
                        <form onSubmit={handleAddItem} className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-4">
                            <div>
                                <label htmlFor="newItemTitle" className="block text-sm font-medium mb-1">Judul Item</label>
                                <input type="text" id="newItemTitle" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Misal: Hook useState" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                            <div>
                                <label htmlFor="newItemUrl" className="block text-sm font-medium mb-1">URL</label>
                                <input type="url" id="newItemUrl" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} placeholder="https://..." className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                             <div>
                                <label htmlFor="newItemDescription" className="block text-sm font-medium mb-1">Deskripsi Singkat (Opsional)</label>
                                <textarea id="newItemDescription" value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} rows="2" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
                            </div>
                            <button type="submit" className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors">Tambah Item ke Koleksi</button>
                        </form>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Daftar Item di Koleksi Ini</h2>
                        {items.length > 0 ? (
                            <ul className="space-y-3">
                                {items.map(item => (
                                    <li key={item.id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-start">
                                        <div>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-500 hover:underline">{item.title}</a>
                                            {item.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>}
                                        </div>
                                        <button onClick={() => handleDeleteItem(item)} className="ml-4 flex-shrink-0 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors" title="Hapus Item">
                                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 py-4">Belum ada item di dalam koleksi ini. Mulai tambahkan dengan form di atas.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WebCollectionDetailPage;
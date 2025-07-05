import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import WebCollectionModal from '../components/WebCollectionModal'; // Import modal baru

// Ikon-ikon
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

function WebCollectionsPage({ session }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collections, setCollections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false); // State untuk modal
    const user = session?.user;

    // --- Pengolahan Data dengan useMemo ---
    const parentCategories = useMemo(() => categories.filter(cat => !cat.parent_id).sort((a,b) => a.name.localeCompare(b.name)), [categories]);
    
    const subCategoriesByParent = useMemo(() => {
        const grouped = {};
        parentCategories.forEach(pCat => {
            grouped[pCat.id] = categories.filter(cat => cat.parent_id === pCat.id).sort((a,b) => a.name.localeCompare(b.name));
        });
        return grouped;
    }, [categories, parentCategories]);

    const collectionsBySubCategory = useMemo(() => {
        const grouped = {};
        collections.forEach(col => {
            if (!grouped[col.category_id]) {
                grouped[col.category_id] = [];
            }
            grouped[col.category_id].push(col);
        });
        for (const subCatId in grouped) {
            grouped[subCatId].sort((a, b) => a.title.localeCompare(b.title));
        }
        return grouped;
    }, [collections]);
    // --- End Pengolahan Data ---

    useEffect(() => {
        async function fetchData() {
            if (!user) {
                setError("User not authenticated.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const [categoriesRes, collectionsRes] = await Promise.all([
                    supabase.from('web_categories').select('*').eq('user_id', user.id),
                    supabase.from('web_collections').select('*').eq('user_id', user.id)
                ]);

                if (categoriesRes.error) throw categoriesRes.error;
                if (collectionsRes.error) throw collectionsRes.error;

                setCategories(categoriesRes.data || []);
                setCollections(collectionsRes.data || []);
            } catch (err) {
                console.error("Error fetching data:", err.message);
                setError("Gagal memuat data: " + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    // --- Fungsi Handler untuk Aksi dari Halaman ---
    const handleDeleteCollection = async (collectionToDelete) => {
        const confirmText = window.prompt(`Anda akan menghapus koleksi "${collectionToDelete.title}". Aksi ini tidak dapat dibatalkan.\n\nUntuk konfirmasi, ketik 'HAPUS' di bawah ini.`);
        if (confirmText === "HAPUS") {
            try {
                const { error } = await supabase.from('web_collections').delete().eq('id', collectionToDelete.id);
                if (error) throw error;
                setCollections(prev => prev.filter(c => c.id !== collectionToDelete.id));
                alert('Koleksi berhasil dihapus.');
            } catch (err) {
                setError("Gagal menghapus koleksi: " + err.message);
            }
        } else if (confirmText !== null) {
            alert("Penghapusan dibatalkan.");
        }
    };
    
    const handleDeleteCategory = async (categoryToDelete) => {
        const confirmText = window.prompt(`Anda akan menghapus kategori "${categoryToDelete.name}".\n\nUntuk konfirmasi, ketik 'HAPUS' di bawah ini.`);
        if(confirmText === "HAPUS"){
            try {
                const { error } = await supabase.from('web_categories').delete().eq('id', categoryToDelete.id);
                if (error) throw error;
                setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
                alert('Kategori berhasil dihapus.');
            } catch(err) {
                setError(`Gagal menghapus kategori. Mungkin masih ada sub-kategori atau koleksi di dalamnya. Error: ${err.message}`);
            }
        }
    };

    // --- Handler untuk data baru dari Modal ---
    const handleCategoryCreated = (newCategory) => {
        setCategories(prev => [...prev, newCategory]);
    };
    
    const handleCollectionCreated = (newCollection) => {
        // Karena halaman akan navigasi, kita bisa memilih untuk tidak melakukan apa-apa,
        // atau menambahkan ke state agar UI responsif jika pengguna kembali.
        setCollections(prev => [...prev, newCollection]);
    };
    
    if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Terjadi kesalahan: {error}</div>;

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold dark:text-white">Koleksi Web</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors"
                >
                    + Tambah Baru
                </button>
            </div>
            
            {/* FORM LAMA DIHAPUS TOTAL DARI SINI */}

            {/* --- TAMPILAN UTAMA DAFTAR KOLEKSI --- */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Semua Koleksi Anda</h2>
                <div className="space-y-6">
                    {parentCategories.length > 0 ? parentCategories.map(pCat => (
                        <div key={pCat.id} className="p-4 rounded-lg border dark:border-gray-700">
                            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex justify-between items-center">
                                {pCat.name}
                                <button onClick={() => handleDeleteCategory(pCat)} className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100 transition-opacity" title="Hapus Kategori Induk"><TrashIcon/></button>
                            </h3>
                            <div className="pl-4 mt-2 space-y-4">
                                {(subCategoriesByParent[pCat.id] || []).length > 0 ? (subCategoriesByParent[pCat.id] || []).map(sCat => (
                                    <div key={sCat.id}>
                                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex justify-between items-center">
                                            {sCat.name}
                                            <button onClick={() => handleDeleteCategory(sCat)} className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100 transition-opacity" title="Hapus Sub-Kategori"><TrashIcon/></button>
                                        </h4>
                                        <ul className="pl-4 mt-2 space-y-2 list-disc list-inside">
                                            {(collectionsBySubCategory[sCat.id] || []).map(col => (
                                                <li key={col.id} className="flex justify-between items-center">
                                                    <Link to={`/web-collections/${col.id}`} className="text-blue-500 hover:underline">
                                                        {col.title}
                                                    </Link>
                                                    <button onClick={() => handleDeleteCollection(col)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors" title="Hapus Koleksi"><TrashIcon /></button>
                                                </li>
                                            ))}
                                        </ul>
                                        {!(collectionsBySubCategory[sCat.id] || []).length && (
                                            <p className="pl-4 text-sm text-gray-500 italic">Belum ada koleksi di sini.</p>
                                        )}
                                    </div>
                                )) : <p className="text-sm text-gray-500 italic">Belum ada sub-kategori di sini.</p>}
                            </div>
                        </div>
                    )) : (
                        !loading && <p className="text-center text-gray-500 py-4">Anda belum membuat Kategori. Mulai dengan tombol '+ Tambah Baru' di atas.</p>
                    )}
                </div>
            </div>
            
            <WebCollectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                categories={categories}
                user={user}
                onCollectionCreated={handleCollectionCreated}
                onCategoryCreated={handleCategoryCreated}
            />
        </div>
    );
}

export default WebCollectionsPage;
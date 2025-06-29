import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

// Ikon-ikon (tidak berubah)
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

function WebCollectionsPage({ session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk data mentah dari Supabase
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);

  // State untuk form
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [newParentCategoryName, setNewParentCategoryName] = useState(''); // <-- State baru
  const [newSubCategoryName, setNewSubCategoryName] = useState(''); // <-- State baru
  const [selectedParentForSub, setSelectedParentForSub] = useState(''); // <-- State baru

  const user = session?.user;

  // --- PENGOLAHAN DATA DENGAN useMemo ---
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
    // urutkan koleksi dalam setiap subkategori
    for (const subCatId in grouped) {
        grouped[subCatId].sort((a, b) => a.title.localeCompare(b.title));
    }
    return grouped;
  }, [collections]);
  // --- END PENGOLAHAN DATA ---

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
        
        // Inisialisasi pilihan form jika belum ada
        const firstParent = categoriesRes.data.find(c => !c.parent_id);
        if (firstParent && !selectedParentForSub) {
            setSelectedParentForSub(firstParent.id);
        }

      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // --- FUNGSI-FUNGSI HANDLER YANG DIPERBARUI ---
  const handleAddCategory = async (e, parentId = null) => {
    e.preventDefault();
    const name = parentId ? newSubCategoryName : newParentCategoryName;
    if (!name.trim()) return;

    try {
      const { data, error } = await supabase.from('web_categories').insert({
        user_id: user.id,
        name: name.trim(),
        parent_id: parentId
      }).select().single();
      
      if (error) throw error;

      setCategories(prev => [...prev, data]);
      if (parentId) {
        setNewSubCategoryName('');
      } else {
        setNewParentCategoryName('');
      }
      alert('Kategori berhasil ditambahkan!');
    } catch (err) {
      console.error("Error adding category:", err.message);
      setError("Gagal menambahkan kategori: " + err.message);
    }
  };

  const handleAddCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionTitle || !selectedSubCategory) {
      alert("Judul dan Sub-Kategori koleksi tidak boleh kosong!");
      return;
    }
    try {
      const { data, error } = await supabase.from('web_collections').insert({
        user_id: user.id,
        title: newCollectionTitle,
        category_id: selectedSubCategory
      }).select('id').single();
      
      if (error) throw error;

      setNewCollectionTitle('');
      alert('Koleksi web berhasil ditambahkan!');
      navigate(`/web-collections/${data.id}`);
    } catch (err) {
      console.error("Error adding web collection:", err.message);
      setError("Gagal menambahkan koleksi: " + err.message);
    }
  };

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
      // Logika ini bisa diperumit untuk menangani penghapusan parent, tapi untuk sekarang kita buat simpel
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
  
  if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Terjadi kesalahan: {error}</div>;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <h1 className="text-3xl font-bold dark:text-white">Koleksi Web</h1>
      
      {/* --- BAGIAN FORM YANG DIDESAIN ULANG --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FORM TAMBAH KOLEKSI */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Tambah Koleksi Baru</h2>
          <form onSubmit={handleAddCollection} className="space-y-4">
            <div>
              <label htmlFor="collectionTitle" className="block text-sm font-medium mb-1 dark:text-gray-300">Judul Koleksi</label>
              <input type="text" id="collectionTitle" value={newCollectionTitle} onChange={e => setNewCollectionTitle(e.target.value)} placeholder="Misal: Tutorial React Terbaik" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label htmlFor="collectionCategory" className="block text-sm font-medium mb-1 dark:text-gray-300">Pilih Sub-Kategori</label>
              <select id="collectionCategory" value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required>
                <option value="" disabled>-- Pilih --</option>
                {parentCategories.map(pCat => (
                  <optgroup key={pCat.id} label={pCat.name}>
                    {(subCategoriesByParent[pCat.id] || []).map(sCat => (
                      <option key={sCat.id} value={sCat.id}>{sCat.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2">
              <PlusIcon /> Tambah Koleksi
            </button>
          </form>
        </div>
        {/* FORM MANAJEMEN KATEGORI */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Tambah Kategori Induk</h2>
                <form onSubmit={(e) => handleAddCategory(e, null)} className="flex gap-2">
                    <input type="text" value={newParentCategoryName} onChange={e => setNewParentCategoryName(e.target.value)} placeholder="Misal: Programming" className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Tambah</button>
                </form>
            </div>
            <div className="border-t dark:border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Tambah Sub-Kategori</h2>
                 <form onSubmit={(e) => handleAddCategory(e, selectedParentForSub)} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Di bawah Kategori Induk:</label>
                        <select value={selectedParentForSub} onChange={e => setSelectedParentForSub(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required>
                             <option value="" disabled>-- Pilih Kategori Induk --</option>
                             {parentCategories.map(pCat => (<option key={pCat.id} value={pCat.id}>{pCat.name}</option>))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nama Sub-Kategori Baru:</label>
                        <input type="text" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)} placeholder="Misal: React" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                     </div>
                    <button type="submit" className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Tambah Sub-Kategori</button>
                </form>
            </div>
        </div>
      </div>

      {/* --- BAGIAN TAMPILAN UTAMA YANG BARU --- */}
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
            !loading && <p className="text-center text-gray-500 py-4">Anda belum membuat Kategori Induk. Mulai dengan form di atas.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebCollectionsPage;
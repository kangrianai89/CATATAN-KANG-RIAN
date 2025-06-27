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
  
  // State untuk form edit
  const [editCollectionTitle, setEditCollectionTitle] = useState('');
  const [editCollectionDescription, setEditCollectionDescription] = useState('');
  const [editCollectionCategory, setEditCollectionCategory] = useState('');

  // State untuk form tambah item
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  const user = session?.user;

  // --- KUNCI UNIK UNTUK SESSION STORAGE ---
  const DRAFT_KEY = `web-collection-draft-${id}`;

  // --- useEffect utama: Mengambil data ATAU memuat draf ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (!user || !id) return;

        // Cek draf terlebih dahulu
        const savedDraft = sessionStorage.getItem(DRAFT_KEY);
        if (savedDraft && isEditingCollection) { // Hanya muat draf jika dalam mode edit
          console.log("Memuat draf dari session storage...");
          const draft = JSON.parse(savedDraft);
          setEditCollectionTitle(draft.title);
          setEditCollectionDescription(draft.description);
          setEditCollectionCategory(draft.categoryId);
        } else {
          // Ambil detail koleksi induk
          const { data: collectionData, error: collectionError } = await supabase.from('web_collections').select(`*, web_categories (name)`).eq('id', id).eq('user_id', user.id).single();
          if (collectionError) {
            if (collectionError.code === 'PGRST116') setError("Koleksi tidak ditemukan atau Anda tidak memiliki akses.");
            else throw collectionError;
          } else {
            setCollection(collectionData);
            // Set state edit dari data yang baru diambil
            setEditCollectionTitle(collectionData.title);
            setEditCollectionDescription(collectionData.description || '');
            setEditCollectionCategory(collectionData.category_id || '');
          }
        }
        
        // Ambil kategori & item (selalu)
        const { data: categoriesData, error: categoriesError } = await supabase.from('web_categories').select('*').eq('user_id', user.id);
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        const { data: itemsData, error: itemsError } = await supabase.from('web_items').select('*').eq('collection_id', id).order('created_at', { ascending: true });
        if (itemsError) throw itemsError;
        setItems(itemsData);

      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, user]); // Dependency array disederhanakan

  // --- useEffect BARU: Menyimpan draf setiap kali ada perubahan di form edit ---
  useEffect(() => {
    // Hanya simpan draf jika dalam mode edit
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
      sessionStorage.removeItem(DRAFT_KEY); // Hapus draf setelah berhasil simpan
      alert('Koleksi berhasil diperbarui!');
    } catch (err) {
      console.error("Error updating collection:", err.message);
      setError("Gagal memperbarui koleksi: " + err.message);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditingCollection(false);
    sessionStorage.removeItem(DRAFT_KEY); // Hapus draf saat batal
    // Reset form ke data asli dari state `collection`
    setEditCollectionTitle(collection.title);
    setEditCollectionDescription(collection.description || '');
    setEditCollectionCategory(collection.category_id || '');
  };

  const handleAddItem = async (e) => { /* ... (kode sama, tidak ada perubahan) ... */ };
  const handleDeleteItem = async (item) => { /* ... (kode sama, tidak ada perubahan) ... */ };

  if (loading) return <div className="p-6 text-center">Memuat detail koleksi...</div>;
  if (error) return <div className="p-6 text-red-500">Terjadi kesalahan: {error}</div>;
  if (!collection) return <div className="p-6 text-center text-gray-600 dark:text-gray-400">Koleksi tidak ditemukan.</div>;

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-3xl mx-auto">
        <button onClick={() => navigate('/web-collections')} className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>
          Kembali ke Koleksi Utama
        </button>
        {!isEditingCollection ? (
          <>
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-between">
              {collection.title}
              <button onClick={() => setIsEditingCollection(true)} className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors">Edit Koleksi</button>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Kategori: <span className="font-medium">{collection.web_categories ? collection.web_categories.name : 'Tidak Terkategori'}</span></p>
            {collection.description && (<p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">{collection.description}</p>)}
          </>
        ) : (
          <form onSubmit={handleUpdateCollection} className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold mb-4">Edit Detail Koleksi</h1>
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
                    {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
                </select>
                {categories.length === 0 && ( <p className="text-sm text-red-500 mt-1">Belum ada kategori.</p> )}
            </div>
            <div className="flex gap-4">
                <button type="submit" className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors" disabled={categories.length === 0}>Simpan Perubahan</button>
                <button type="button" onClick={handleCancelEdit} className="flex-1 px-6 py-2 bg-gray-400 hover:bg-gray-500 text-gray-800 font-medium rounded-md transition-colors">Batal</button>
            </div>
          </form>
        )}
        <hr className="my-6 border-gray-200 dark:border-gray-700" />
        {/* ... (Sisa JSX untuk tambah & daftar item tidak berubah) ... */}
      </div>
    </div>
  );
}
export default WebCollectionDetailPage;
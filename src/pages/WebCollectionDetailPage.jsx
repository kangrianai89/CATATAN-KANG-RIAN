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
  const [editCollectionTitle, setEditCollectionTitle] = useState('');
  const [editCollectionDescription, setEditCollectionDescription] = useState('');
  const [editCollectionCategory, setEditCollectionCategory] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const user = session?.user;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (!user) { setError("User not authenticated."); setLoading(false); return; }
        if (!id) { setError("ID koleksi tidak ditemukan di URL."); setLoading(false); return; }

        const { data: categoriesData, error: categoriesError } = await supabase.from('web_categories').select('*').eq('user_id', user.id);
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        const { data: collectionData, error: collectionError } = await supabase.from('web_collections').select(`*, web_categories (name)`).eq('id', id).eq('user_id', user.id).single();
        if (collectionError) {
          if (collectionError.code === 'PGRST116') { setError("Koleksi tidak ditemukan atau Anda tidak memiliki akses."); } 
          else { throw collectionError; }
        } else {
          setCollection(collectionData);
          setEditCollectionTitle(collectionData.title);
          setEditCollectionDescription(collectionData.description || '');
          setEditCollectionCategory(collectionData.category_id || '');
        }

        const { data: itemsData, error: itemsError } = await supabase.from('web_items').select('*').eq('collection_id', id).order('order', { ascending: true }).order('created_at', { ascending: true });
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
  }, [id, user]);

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
      alert('Koleksi berhasil diperbarui!');
    } catch (err) {
      console.error("Error updating collection:", err.message);
      setError("Gagal memperbarui koleksi: " + err.message);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle || !newItemUrl) {
      alert("Judul dan URL item tidak boleh kosong!");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('web_items')
        .insert({ collection_id: id, title: newItemTitle, url: newItemUrl, description: newItemDescription })
        .select();
      if (error) throw error;
      setItems([...items, data[0]]);
      setNewItemTitle('');
      setNewItemUrl('');
      setNewItemDescription('');
      alert('Item berhasil ditambahkan ke koleksi!');
    } catch (err) {
      console.error("Error adding item:", err.message);
      setError("Gagal menambahkan item: " + err.message);
    }
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus item "${item.title}"?`)) {
      const confirmText = window.prompt("Aksi ini permanen. Untuk konfirmasi, ketik 'HAPUS' di bawah ini.");
      if (confirmText === "HAPUS") {
        try {
          const { error } = await supabase.from('web_items').delete().eq('id', item.id);
          if (error) throw error;
          setItems(items.filter(i => i.id !== item.id));
          alert('Item berhasil dihapus!');
        } catch (err) {
          console.error("Error deleting item:", err.message);
          setError("Gagal menghapus item: " + err.message);
        }
      } else if (confirmText !== null) {
        alert("Penghapusan dibatalkan. Teks konfirmasi tidak cocok.");
      }
    }
  };

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
            <div><label htmlFor="editCollectionTitle" className="block text-sm font-medium mb-1">Judul Koleksi</label><input type="text" id="editCollectionTitle" value={editCollectionTitle} onChange={(e) => setEditCollectionTitle(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label htmlFor="editCollectionDescription" className="block text-sm font-medium mb-1">Deskripsi Koleksi (Opsional)</label><textarea id="editCollectionDescription" value={editCollectionDescription} onChange={(e) => setEditCollectionDescription(e.target.value)} rows="3" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
            <div><label htmlFor="editCollectionCategory" className="block text-sm font-medium mb-1">Kategori Koleksi</label><select id="editCollectionCategory" value={editCollectionCategory} onChange={(e) => setEditCollectionCategory(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="" disabled>Pilih Kategori</option>{categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}</select>{categories.length === 0 && ( <p className="text-sm text-red-500 mt-1">Belum ada kategori. Silakan tambah kategori di halaman Koleksi Web.</p> )}</div>
            <div className="flex gap-4"><button type="submit" className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors" disabled={categories.length === 0}>Simpan Perubahan Koleksi</button><button type="button" onClick={() => setIsEditingCollection(false)} className="flex-1 px-6 py-2 bg-gray-400 hover:bg-gray-500 text-gray-800 font-medium rounded-md transition-colors">Batal</button></div>
          </form>
        )}
        <hr className="my-6 border-gray-200 dark:border-gray-700" />
        <div className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg p-5 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tambah Item (Link) Baru ke Koleksi Ini</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div><label htmlFor="newItemTitle" className="block text-sm font-medium mb-1">Judul Item</label><input type="text" id="newItemTitle" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Judul link di dalam koleksi" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label htmlFor="newItemUrl" className="block text-sm font-medium mb-1">URL Item</label><input type="url" id="newItemUrl" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} placeholder="https://contoh.com/artikel-spesifik" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label htmlFor="newItemDescription" className="block text-sm font-medium mb-1">Deskripsi Item (Opsional)</label><textarea id="newItemDescription" value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} placeholder="Penjelasan singkat tentang item link ini..." rows="2" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
            <button type="submit" className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors">Tambah Item ke Koleksi Ini</button>
          </form>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 shadow rounded-lg p-5">
          <h2 className="text-2xl font-semibold mb-4">Item dalam Koleksi "{collection.title}"</h2>
          {items.length === 0 ? ( <p className="text-center text-gray-600 dark:text-gray-400">Belum ada item dalam koleksi ini. Tambahkan yang pertama di atas!</p> ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 flex flex-col">
                  <h3 className="text-xl font-semibold mb-1 flex items-center justify-between">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{item.title}</a>
                    <button onClick={() => handleDeleteItem(item)} className="text-red-500 hover:text-red-700 ml-2" title="Hapus Item">&times;</button>
                  </h3>
                  {item.description && (<p className="text-gray-700 dark:text-gray-300 text-sm mb-2 whitespace-pre-wrap">{item.description}</p>)}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-auto">Ditambahkan: {new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebCollectionDetailPage;
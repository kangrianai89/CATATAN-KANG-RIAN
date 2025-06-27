import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

// Ikon-ikon
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;


function WebCollectionsPage({ session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk data
  const [categories, setCategories] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  // State untuk form
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const user = session?.user;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        // Mengambil semua data secara paralel
        const [categoriesRes, recentItemsRes] = await Promise.all([
            supabase.from('web_categories').select('*').eq('user_id', user.id).order('name'),
            supabase.from('web_items').select('*, web_collections(title, web_categories(name))').order('created_at', { ascending: false }).limit(10)
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (recentItemsRes.error) throw recentItemsRes.error;

        setCategories(categoriesRes.data || []);
        setRecentItems(recentItemsRes.data || []);

        // Set default category untuk form jika ada
        if (categoriesRes.data && categoriesRes.data.length > 0 && !selectedCategory) {
            setSelectedCategory(categoriesRes.data[0].id);
        }

      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]); // Dijalankan hanya sekali saat user berubah

  const handleAddCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionTitle || !selectedCategory) {
      alert("Judul dan Kategori koleksi tidak boleh kosong!");
      return;
    }
    try {
      const { data, error } = await supabase.from('web_collections').insert({ user_id: user.id, title: newCollectionTitle, category_id: selectedCategory }).select('id').single();
      if (error) throw error;
      setNewCollectionTitle('');
      alert('Koleksi web berhasil ditambahkan!');
      // Navigasi ke halaman detail koleksi yang baru dibuat
      navigate(`/web-collections/${data.id}`);
    } catch (err) {
      console.error("Error adding web collection:", err.message);
      setError("Gagal menambahkan koleksi: " + err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const { data, error } = await supabase.from('web_categories').insert({ user_id: user.id, name: newCategoryName.trim() }).select().single();
      if (error) throw error;
      setCategories(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      alert('Kategori berhasil ditambahkan!');
    } catch (err) {
      console.error("Error adding category:", err.message);
      setError("Gagal menambahkan kategori: " + err.message);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`Menghapus kategori "${cat.name}" akan membuat koleksi yang terkait tidak memiliki kategori. Lanjutkan?`)) {
      const confirmText = window.prompt("Aksi ini permanen. Untuk konfirmasi, ketik 'HAPUS' di bawah ini.");
      if (confirmText === "HAPUS") {
        try {
          const { error } = await supabase.from('web_categories').delete().eq('id', cat.id);
          if (error) throw error;
          setCategories(categories.filter(c => c.id !== cat.id));
          alert('Kategori berhasil dihapus!');
        } catch (err) {
          setError("Gagal menghapus kategori: " + err.message);
        }
      } else if (confirmText !== null) {
        alert("Penghapusan dibatalkan. Teks konfirmasi tidak cocok.");
      }
    }
  };

  if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Terjadi kesalahan: {error}</div>;

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold dark:text-white">Koleksi Web</h1>
        
        {/* Bagian 1: Form Tambah Koleksi & Kategori */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Tambah Koleksi Induk Baru</h2>
                <form onSubmit={handleAddCollection} className="space-y-4">
                    <div>
                        <label htmlFor="collectionTitle" className="block text-sm font-medium mb-1">Judul Koleksi</label>
                        <input type="text" id="collectionTitle" value={newCollectionTitle} onChange={(e) => setNewCollectionTitle(e.target.value)} placeholder="Misal: Tutorial React Terbaik" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label htmlFor="collectionCategory" className="block text-sm font-medium mb-1">Pilih Kategori</label>
                        <select id="collectionCategory" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="" disabled>-- Pilih Kategori --</option>
                        {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
                        </select>
                        {categories.length === 0 && ( <p className="text-sm text-yellow-500 mt-1">Belum ada kategori. Silakan tambah di sebelah.</p> )}
                    </div>
                    <button type="submit" className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors" disabled={categories.length === 0}>
                        <PlusIcon /> Tambah Koleksi Baru
                    </button>
                </form>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Manajemen Kategori</h2>
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nama Kategori Baru" className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">Tambah</button>
                </form>
                <div className="border-t dark:border-gray-700 pt-4">
                    <h3 className="font-medium mb-2">Kategori yang ada:</h3>
                    {categories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <span key={cat.id} className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {cat.name}
                            <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700" title="Hapus Kategori"><TrashIcon /></button>
                            </span>
                        ))}
                        </div>
                    ) : <p className="text-sm text-gray-500">Belum ada kategori.</p>}
                </div>
            </div>
        </div>

        {/* Bagian 2 & 3: Navigasi Kategori & Item Terbaru */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Telusuri Koleksi</h2>
            <div className="mb-6">
                <h3 className="font-medium mb-2">Telusuri berdasarkan Kategori:</h3>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <Link key={cat.id} to={`/web-collections/category/${cat.id}`} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>
            <hr className="my-6 border-gray-300 dark:border-gray-700"/>
            <div>
                <h3 className="font-medium mb-2">10 Item Terbaru Ditambahkan:</h3>
                {recentItems.length > 0 ? (
                    <ul className="space-y-2">
                        {recentItems.map(item => (
                            <li key={item.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                                <div>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-semibold">{item.title}</a>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">di Koleksi: <Link to={`/web-collections/${item.web_collections.id}`} className="hover:underline">{item.web_collections.title}</Link></p>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">{item.web_collections.web_categories.name}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-gray-500">Belum ada item yang ditambahkan.</p>}
            </div>
        </div>
    </div>
  );
}

export default WebCollectionsPage;
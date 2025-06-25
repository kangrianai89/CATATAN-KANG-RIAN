import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function WebCollectionsPage({ session }) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State baru untuk form tambah koleksi induk
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  // newCollectionDescription tetap ada untuk inputan user
  const [newCollectionDescription, setNewCollectionDescription] = useState(''); 
  const [selectedCategory, setSelectedCategory] = useState('');

  // State untuk form tambah kategori (tetap sama)
  const [newCategoryName, setNewCategoryName] = useState('');

  const user = session?.user;

  // --- Fungsi Pengambilan Data ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (!user) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        // Ambil kategori
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('web_categories')
          .select('*')
          .eq('user_id', user.id);

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);
        if (categoriesData.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesData[0].id);
        }

        // Ambil KOLEKSI INDUK (web_collections) beserta nama kategori
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('web_collections')
          .select(`
            *,
            web_categories (
              name
            )
          `)
          .eq('user_id', user.id);

        if (collectionsError) throw collectionsError;
        setCollections(collectionsData);

      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, selectedCategory]);

  // --- Fungsi Tambah KOLEKSI INDUK BARU ---
  const handleAddCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionTitle || !selectedCategory) {
      alert("Judul dan Kategori koleksi tidak boleh kosong!");
      return;
    }
    if (!user) {
      alert("Anda harus login untuk menambahkan koleksi.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('web_collections')
        .insert({
          user_id: user.id,
          title: newCollectionTitle,
          // Hapus baris ini karena kolom 'description' sudah dihapus dari tabel web_collections
          // description: newCollectionDescription, 
          category_id: selectedCategory,
        })
        .select(`
          *,
          web_categories (
            name
          )
        `);

      if (error) throw error;

      setCollections([...collections, data[0]]);
      setNewCollectionTitle('');
      setNewCollectionDescription(''); // Tetap reset state input form
      alert('Koleksi web berhasil ditambahkan!');
    } catch (err) {
      console.error("Error adding web collection:", err.message);
      setError("Gagal menambahkan koleksi: " + err.message);
    }
  };

  // --- Fungsi Tambah Kategori (tetap sama) ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert("Nama kategori tidak boleh kosong!");
      return;
    }
    if (!user) {
      alert("Anda harus login untuk menambahkan kategori.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('web_categories')
        .insert({
          user_id: user.id,
          name: newCategoryName.trim(),
        })
        .select();

      if (error) throw error;

      const newCat = data[0];
      setCategories([...categories, newCat]);
      setNewCategoryName('');
      alert('Kategori berhasil ditambahkan!');
      if (categories.length === 0) {
        setSelectedCategory(newCat.id);
      }
    } catch (err) {
      console.error("Error adding category:", err.message);
      setError("Gagal menambahkan kategori: " + err.message);
    }
  };

  // --- Fungsi Hapus KOLEKSI INDUK ---
  const handleDeleteCollection = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus koleksi ini? Semua item di dalamnya juga akan terhapus!")) return;
    if (!user) {
      alert("Anda harus login untuk menghapus koleksi.");
      return;
    }
    try {
      const { error } = await supabase
        .from('web_collections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCollections(collections.filter(collectionItem => collectionItem.id !== id));
      alert('Koleksi web berhasil dihapus!');
    } catch (err) {
      console.error("Error deleting web collection:", err.message);
      setError("Gagal menghapus koleksi: " + err.message);
    }
  };

  // --- Fungsi Hapus Kategori (tetap sama, tapi refresh collections) ---
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Menghapus kategori ini akan membuat koleksi yang terkait tidak memiliki kategori. Lanjutkan?")) return;
    if (!user) {
      alert("Anda harus login untuk menghapus kategori.");
      return;
    }
    try {
      const { error } = await supabase
        .from('web_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(categories.filter(cat => cat.id !== id));
      if (selectedCategory === id) {
        setSelectedCategory(categories.length > 1 ? categories.filter(cat => cat.id !== id)[0]?.id : '');
      }
      const { data: updatedCollections, error: updateError } = await supabase
        .from('web_collections')
        .select(`
          *,
          web_categories (
            name
          )
        `)
        .eq('user_id', user.id);
      if (updateError) throw updateError;
      setCollections(updatedCollections);

      alert('Kategori berhasil dihapus!');
    } catch (err) {
      console.error("Error deleting category:", err.message);
      setError("Gagal menghapus kategori: " + err.message);
    }
  };

  const handleCardClick = (collectionId) => {
    navigate(`/web-collections/${collectionId}`);
  };

  if (loading) {
    return <div className="p-6 text-center">Memuat koleksi web dan kategori...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Terjadi kesalahan: {error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Koleksi Web Saya</h1>

      {/* Form Tambah Kategori */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Tambah Kategori Baru</h2>
        <form onSubmit={handleAddCategory} className="flex gap-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nama Kategori (misal: Belajar React)"
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Tambah Kategori
          </button>
        </form>
        {categories.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Kategori Anda:</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span key={cat.id} className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {cat.name}
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-500 hover:text-red-700 ml-1"
                    title="Hapus Kategori"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Tambah KOLEKSI INDUK Baru */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Tambah Koleksi Web Baru</h2>
        <form onSubmit={handleAddCollection} className="space-y-4">
          <div>
            <label htmlFor="collectionTitle" className="block text-sm font-medium mb-1">Judul Koleksi</label>
            <input
              type="text"
              id="collectionTitle"
              value={newCollectionTitle}
              onChange={(e) => setNewCollectionTitle(e.target.value)}
              placeholder="Misal: Tutorial React Terbaik"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="collectionDescription" className="block text-sm font-medium mb-1">Deskripsi Koleksi (Opsional)</label>
            <textarea
              id="collectionDescription"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Penjelasan singkat tentang koleksi ini..."
              rows="3"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="collectionCategory" className="block text-sm font-medium mb-1">Kategori Koleksi</label>
            <select
              id="collectionCategory"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>Pilih Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-sm text-red-500 mt-1">Belum ada kategori. Silakan tambah kategori di atas terlebih dahulu.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
            disabled={categories.length === 0}
          >
            Tambah Koleksi Web
          </button>
        </form>
      </div>

      {/* Daftar Koleksi Web Induk */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Daftar Koleksi Web Anda</h2>
        {collections.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Belum ada koleksi web. Tambahkan yang pertama di atas!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collectionItem) => (
              <div
                key={collectionItem.id}
                onClick={() => handleCardClick(collectionItem.id)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 flex flex-col justify-between
                           cursor-pointer hover:shadow-lg transition-shadow duration-200"
              >
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center justify-between">
                    <span className="text-gray-900 dark:text-gray-100"> 
                      {collectionItem.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteCollection(collectionItem.id, e)}
                      className="text-red-500 hover:text-red-700 ml-2 z-10"
                      title="Hapus Koleksi (dan semua item di dalamnya)"
                    >
                      &times;
                    </button>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Kategori: <span className="font-medium">{collectionItem.web_categories ? collectionItem.web_categories.name : 'Tidak Terkategori'}</span>
                  </p>
                  {collectionItem.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{collectionItem.description}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Ditambahkan: {new Date(collectionItem.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WebCollectionsPage;
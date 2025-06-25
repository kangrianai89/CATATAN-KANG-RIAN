import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function WebCollectionsPage({ session }) {
  const navigate = useNavigate(); // Inisialisasi useNavigate
  const [webCollections, setWebCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk form tambah/edit koleksi web
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // State untuk form tambah kategori
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dapatkan user dari session prop
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
        // Set default category jika ada
        if (categoriesData.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesData[0].id);
        }

        // Ambil koleksi web beserta nama kategori
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
        setWebCollections(collectionsData);

      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, selectedCategory]);

  // --- Fungsi Tambah Koleksi Web ---
  const handleAddWebLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl || !selectedCategory) {
      alert("Judul, URL, dan Kategori tidak boleh kosong!");
      return;
    }
    if (!user) {
      alert("Anda harus login untuk menambahkan link.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('web_collections')
        .insert({
          user_id: user.id,
          title: newLinkTitle,
          url: newLinkUrl,
          description: newLinkDescription,
          category_id: selectedCategory,
        })
        .select(`
          *,
          web_categories (
            name
          )
        `);

      if (error) throw error;

      setWebCollections([...webCollections, data[0]]);
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkDescription('');
      alert('Link web berhasil ditambahkan!');
    } catch (err) {
      console.error("Error adding web link:", err.message);
      setError("Gagal menambahkan link: " + err.message);
    }
  };

  // --- Fungsi Tambah Kategori ---
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

  // --- Fungsi Hapus Koleksi Web ---
  const handleDeleteWebLink = async (id, e) => {
    // Hentikan event bubbling agar tidak memicu onClick pada div induk
    e.stopPropagation(); 
    if (!window.confirm("Apakah Anda yakin ingin menghapus link ini?")) return;
    if (!user) {
      alert("Anda harus login untuk menghapus link.");
      return;
    }
    try {
      const { error } = await supabase
        .from('web_collections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWebCollections(webCollections.filter(link => link.id !== id));
      alert('Link web berhasil dihapus!');
    } catch (err) {
      console.error("Error deleting web link:", err.message);
      setError("Gagal menghapus link: " + err.message);
    }
  };

  // --- Fungsi Hapus Kategori ---
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Menghapus kategori ini akan membuat link yang terkait tidak memiliki kategori. Lanjutkan?")) return;
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
      setWebCollections(updatedCollections);

      alert('Kategori berhasil dihapus!');
    } catch (err) {
      console.error("Error deleting category:", err.message);
      setError("Gagal menghapus kategori: " + err.message);
    }
  };

  const handleCardClick = (linkId) => {
    navigate(`/web-collections/${linkId}`);
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

      {/* Form Tambah Koleksi Web */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Tambah Link Web Baru</h2>
        <form onSubmit={handleAddWebLink} className="space-y-4">
          <div>
            <label htmlFor="linkTitle" className="block text-sm font-medium mb-1">Judul Link</label>
            <input
              type="text"
              id="linkTitle"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="Judul website atau artikel"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="linkUrl" className="block text-sm font-medium mb-1">URL (Link)</label>
            <input
              type="url"
              id="linkUrl"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://contoh.com/artikel"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="linkDescription" className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
            <textarea
              id="linkDescription"
              value={newLinkDescription}
              onChange={(e) => setNewLinkDescription(e.target.value)}
              placeholder="Penjelasan singkat tentang link ini..."
              rows="3"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="linkCategory" className="block text-sm font-medium mb-1">Kategori</label>
            <select
              id="linkCategory"
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
            Tambah Link Koleksi
          </button>
        </form>
      </div>

      {/* Daftar Koleksi Web */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Daftar Koleksi Web Anda</h2>
        {webCollections.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Belum ada link koleksi web. Tambahkan yang pertama di atas!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webCollections.map((link) => (
              // Mengubah div menjadi bisa diklik
              <div
                key={link.id}
                onClick={() => handleCardClick(link.id)} // Menambahkan onClick
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 flex flex-col justify-between 
                           cursor-pointer hover:shadow-lg transition-shadow duration-200" // Menambahkan kelas untuk kursor dan hover
              >
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center justify-between">
                    {/* Mengubah link asli agar hanya URL, tidak lagi menavigasi ke sana dari title */}
                    <span className="text-gray-900 dark:text-gray-100"> 
                      {link.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteWebLink(link.id, e)} // Meneruskan event 'e'
                      className="text-red-500 hover:text-red-700 ml-2 z-10" // Menambahkan z-10 agar tombol lebih mudah diklik
                      title="Hapus Link"
                    >
                      &times;
                    </button>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Kategori: <span className="font-medium">{link.web_categories ? link.web_categories.name : 'Tidak Terkategori'}</span>
                  </p>
                  {link.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{link.description}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Ditambahkan: {new Date(link.created_at).toLocaleDateString()}
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
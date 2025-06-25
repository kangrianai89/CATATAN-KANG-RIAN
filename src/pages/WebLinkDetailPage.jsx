import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function WebLinkDetailPage({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [categories, setCategories] = useState([]); // State untuk kategori agar bisa dipilih saat edit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // State untuk mode edit

  // State untuk form edit
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const user = session?.user;

  // --- Fungsi Pengambilan Data Link & Kategori ---
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
        if (!id) {
          setError("ID link tidak ditemukan di URL.");
          setLoading(false);
          return;
        }

        // Ambil kategori terlebih dahulu
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('web_categories')
          .select('*')
          .eq('user_id', user.id);
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        // Ambil detail link
        const { data, error: fetchError } = await supabase
          .from('web_collections')
          .select(`
            *,
            web_categories (
              name
            )
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError("Link tidak ditemukan atau Anda tidak memiliki akses.");
          } else {
            throw fetchError;
          }
        } else {
          setLink(data);
          // Set initial state untuk form edit
          setEditTitle(data.title);
          setEditUrl(data.url);
          setEditDescription(data.description || '');
          setEditCategory(data.category_id || ''); // Pastikan category_id ada
        }

      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, user]);

  // --- Fungsi Update Link ---
  const handleUpdateLink = async (e) => {
    e.preventDefault();
    if (!editTitle || !editUrl || !editCategory) {
      alert("Judul, URL, dan Kategori tidak boleh kosong!");
      return;
    }
    if (!user) {
      alert("Anda harus login untuk mengedit link.");
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('web_collections')
        .update({
          title: editTitle,
          url: editUrl,
          description: editDescription,
          category_id: editCategory,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
            *,
            web_categories (
              name
            )
          `)
        .single();

      if (updateError) throw updateError;

      setLink(data); // Perbarui state link dengan data terbaru
      setIsEditing(false); // Keluar dari mode edit
      alert('Link web berhasil diperbarui!');
    } catch (err) {
      console.error("Error updating link:", err.message);
      setError("Gagal memperbarui link: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Memuat detail link...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Terjadi kesalahan: {error}</div>;
  }

  if (!link) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-400">Link tidak ditemukan.</div>;
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/web-collections')}
          className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>
          Kembali ke Koleksi
        </button>

        {!isEditing ? (
          // Mode Tampilan
          <>
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-between">
              {link.title}
              <button
                onClick={() => setIsEditing(true)}
                className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors"
              >
                Edit
              </button>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Kategori: <span className="font-medium">{link.web_categories ? link.web_categories.name : 'Tidak Terkategori'}</span>
            </p>
            <div className="mb-4">
              <p className="text-lg font-semibold text-blue-500 hover:underline break-all">
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
              </p>
            </div>
            
            {link.description && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Deskripsi:</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{link.description}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              Ditambahkan pada: {new Date(link.created_at).toLocaleDateString()}
            </div>
          </>
        ) : (
          // Mode Edit
          <form onSubmit={handleUpdateLink} className="space-y-4">
            <h1 className="text-3xl font-bold mb-4">Edit Link Koleksi</h1>
            <div>
              <label htmlFor="editTitle" className="block text-sm font-medium mb-1">Judul Link</label>
              <input
                type="text"
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Judul website atau artikel"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="editUrl" className="block text-sm font-medium mb-1">URL (Link)</label>
              <input
                type="url"
                id="editUrl"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://contoh.com/artikel"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
              <textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Penjelasan singkat tentang link ini..."
                rows="3"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <div>
              <label htmlFor="editCategory" className="block text-sm font-medium mb-1">Kategori</label>
              <select
                id="editCategory"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Belum ada kategori. Silakan tambah kategori di halaman Koleksi Web.</p>
              )}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
                disabled={categories.length === 0}
              >
                Simpan Perubahan
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-6 py-2 bg-gray-400 hover:bg-gray-500 text-gray-800 font-medium rounded-md transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default WebLinkDetailPage;
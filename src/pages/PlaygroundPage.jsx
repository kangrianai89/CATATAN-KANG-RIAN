import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

function PlaygroundPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  useEffect(() => {
    fetchAssets(); 
  }, [selectedCategoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pages') 
        .select(`
          id,
          title,
          created_at,
          external_link,
          image_url,
          category_id,
          categories (id, name)
        `);

      if (selectedCategoryFilter) {
        query = query.eq('category_id', selectedCategoryFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      alert(error.message);
    }
  };

  // --- FUNGSI BARU UNTUK MENGHAPUS ASET ---
  const handleDeleteAsset = async (assetToDelete) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus aset "${assetToDelete.title}"? Aksi ini tidak dapat dibatalkan.`)) {
        try {
            // Langkah 1: Hapus gambar dari Supabase Storage jika ada
            if (assetToDelete.image_url) {
                // Ekstrak path file dari URL lengkap
                const imagePath = assetToDelete.image_url.substring(assetToDelete.image_url.lastIndexOf('/') + 1);
                
                const { error: storageError } = await supabase.storage
                    .from('asset_images') // Pastikan nama bucket ini benar
                    .remove([imagePath]);
                
                if (storageError) {
                    // Tampilkan error tapi tetap lanjutkan proses hapus data,
                    // karena mungkin file sudah terhapus atau ada masalah lain.
                    console.error("Gagal menghapus gambar dari storage:", storageError.message);
                }
            }

            // Langkah 2: Hapus data aset dari database
            const { error: dbError } = await supabase
                .from('pages')
                .delete()
                .eq('id', assetToDelete.id);

            if (dbError) throw dbError;

            // Langkah 3: Perbarui UI dengan menghapus aset dari state
            setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetToDelete.id));
            alert(`Aset "${assetToDelete.title}" berhasil dihapus.`);

        } catch (error) {
            alert("Gagal menghapus aset: " + error.message);
        }
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Koleksi Aset</h1>
        <Link 
            to="/asset/new"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Tambah Aset Baru
        </Link>
      </div>
      
      <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
            <input 
                type="text"
                placeholder="Cari berdasarkan judul..."
                className="flex-grow px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
                value={selectedCategoryFilter} 
                onChange={(e) => setSelectedCategoryFilter(e.target.value)} 
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value="">Filter: Semua Kategori</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
        </div>
      </div>

      <div>
        {loading ? (
          <p className="dark:text-gray-400">Memuat aset...</p>
        ) : filteredAssets.length === 0 ? (
          <p className="dark:text-gray-400">Tidak ada aset yang ditemukan.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 flex flex-col">
                <img 
                  src={asset.image_url || 'https://placehold.co/600x400/1F2937/FFFFFF?text=No+Image'}
                  alt={asset.title} 
                  className="w-full h-40 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/1F2937/FFFFFF?text=Error'; }}
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg dark:text-white mb-2 truncate">{asset.title}</h3>
                  {asset.categories && (
                    <span className="text-xs font-medium mb-2 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 self-start">
                        {asset.categories.name}
                    </span>
                  )}
                  {/* --- AREA TOMBOL DIPERBARUI --- */}
                  <div className="mt-auto pt-2 flex gap-2">
                    <Link to={`/asset/${asset.id}`} className="flex-grow text-center block px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">
                      Detail
                    </Link>
                    <button onClick={() => handleDeleteAsset(asset)} className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default PlaygroundPage;
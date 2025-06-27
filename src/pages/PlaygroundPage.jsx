import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ImageEditModal from '../components/ImageEditModal';

// Ikon
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;

function PlaygroundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const fetchAssets = async () => {
    try {
      let query = supabase
        .from('pages') 
        .select(`id, title, created_at, external_link, image_path, category_id, user_id, categories (id, name)`);

      if (selectedCategoryFilter) {
        query = query.eq('category_id', selectedCategoryFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      const assetsWithImageUrls = (data || []).map(asset => {
        if (asset.image_path) {
          const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(asset.image_path);
          return { ...asset, image_url: urlData.publicUrl };
        }
        return { ...asset, image_url: null };
      });
      
      setAssets(assetsWithImageUrls);
    } catch (error) {
      console.error("Gagal memuat aset:", error);
      alert("Gagal memuat aset: " + error.message);
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
      console.error("Gagal memuat kategori:", error);
      alert("Gagal memuat kategori: " + error.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAssets(); 
  }, [selectedCategoryFilter, location]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteAsset = async (assetToDelete) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus aset "${assetToDelete.title}"?`)) {
        try {
          if (assetToDelete.image_path) {
            await supabase.storage.from('asset-images').remove([assetToDelete.image_path]);
          }
          await supabase.from('pages').delete().eq('id', assetToDelete.id);
          setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetToDelete.id));
          alert(`Aset "${assetToDelete.title}" berhasil dihapus.`);
        } catch (error) {
            alert("Gagal menghapus aset: " + error.message);
        }
    }
  };

  const handleOpenImageModal = (asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };
  
  const handleImageUpdateSuccess = (assetId, newImageUrl, newImagePath) => {
    setAssets(currentAssets => 
      currentAssets.map(asset => 
        asset.id === assetId ? { ...asset, image_url: newImageUrl, image_path: newImagePath } : asset
      )
    );
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
                <div className="relative group">
                  <img 
                    src={asset.image_url || 'https://placehold.co/600x400/1F2937/FFFFFF?text=No+Image'}
                    alt={asset.title} 
                    className="w-full h-40 object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/1F2937/FFFFFF?text=Error'; }}
                  />
                  <button 
                    onClick={() => handleOpenImageModal(asset)}
                    className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ubah Gambar"
                  >
                    <CameraIcon/>
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg dark:text-white mb-2 truncate">{asset.title}</h3>
                  {asset.categories && (
                    <span className="text-xs font-medium mb-2 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 self-start">
                        {asset.categories.name}
                    </span>
                  )}
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

      {isModalOpen && (
        <ImageEditModal 
          asset={selectedAsset}
          onClose={handleCloseImageModal}
          onSaveSuccess={handleImageUpdateSuccess}
        />
      )}
    </>
  );
}

export default PlaygroundPage;
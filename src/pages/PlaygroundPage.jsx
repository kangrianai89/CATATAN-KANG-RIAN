import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ImageEditModal from '../components/ImageEditModal';

// Ikon-ikon
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

function PlaygroundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [assetCategories, setAssetCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  
  const [newAssetCategoryName, setNewAssetCategoryName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchAssets();
    fetchAssetCategories();
  }, [selectedCategoryFilter, location]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pages')
        .select(`*, asset_categories (id, name)`); 

      if (selectedCategoryFilter) {
        query = query.eq('asset_category_id', selectedCategoryFilter);
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
      alert("Gagal memuat aset: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetCategories = async () => {
    try {
      const { data, error } = await supabase.from('asset_categories').select('id, name').order('name');
      if (error) throw error;
      setAssetCategories(data || []);
    } catch (error) {
      alert("Gagal memuat kategori aset: " + error.message);
    }
  };

  const handleCreateAssetCategory = async (e) => {
    e.preventDefault();
    const name = newAssetCategoryName.trim();
    if (!name) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('asset_categories')
        .insert({ name, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setAssetCategories(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
      setNewAssetCategoryName('');
    } catch (error) {
      alert("Gagal membuat kategori baru: " + error.message);
    }
  };

  const handleDeleteAsset = async (assetToDelete) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus aset "${assetToDelete.title}"? Aksi ini tidak dapat dibatalkan.`)) {
      const confirmationText = window.prompt("Ini adalah aksi permanen. Untuk konfirmasi, ketik 'HAPUS' (dalam huruf besar) di bawah ini.");
      if (confirmationText === "HAPUS") {
        try {
          if (assetToDelete.image_path) {
            await supabase.storage.from('asset-images').remove([assetToDelete.image_path]);
          }
          const { error } = await supabase.from('pages').delete().eq('id', assetToDelete.id);
          if (error) throw error;
          setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetToDelete.id));
          alert(`Aset "${assetToDelete.title}" berhasil dihapus.`);
        } catch (error) {
          alert("Gagal menghapus aset: " + error.message);
        }
      } else if (confirmationText !== null) {
        alert("Penghapusan dibatalkan. Teks konfirmasi tidak cocok.");
      }
    }
  };

  const handleDeleteAssetCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Anda yakin ingin menghapus kategori "${categoryName}"? Aset yang menggunakan kategori ini akan menjadi tidak terkategori.`)) {
      const confirmationText = window.prompt("Aksi ini permanen. Untuk konfirmasi, ketik 'HAPUS' (dalam huruf besar) di bawah ini.");
      if (confirmationText === "HAPUS") {
        try {
          const { error } = await supabase.from('asset_categories').delete().eq('id', categoryId);
          if (error) throw error;
          setAssetCategories(prev => prev.filter(cat => cat.id !== categoryId));
          if (selectedCategoryFilter === categoryId) {
            setSelectedCategoryFilter('');
          }
          alert(`Kategori "${categoryName}" berhasil dihapus.`);
          fetchAssets();
        } catch (error) {
          alert("Gagal menghapus kategori: " + error.message);
        }
      } else if (confirmationText !== null) {
        alert("Penghapusan dibatalkan. Teks konfirmasi tidak cocok.");
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

  const filteredAssets = assets.filter(asset => asset.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Koleksi Aset</h1>
        <Link to="/asset/new" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          + Tambah Aset Baru
        </Link>
      </div>
      
      <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
              type="text"
              placeholder="Cari berdasarkan judul..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
          <form onSubmit={handleCreateAssetCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Buat Kategori Aset Baru..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newAssetCategoryName}
              onChange={(e) => setNewAssetCategoryName(e.target.value)}
              required
            />
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Tambah</button>
          </form>
        </div>
        <div className="mt-4">
          <h3 className="font-medium mb-2 dark:text-white">Filter Kategori:</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategoryFilter('')} className={`px-3 py-1 text-sm rounded-full transition-colors ${!selectedCategoryFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}>
              Semua Kategori
            </button>
            {assetCategories.map(cat => (
              <div key={cat.id} className="relative group flex items-center bg-gray-200 dark:bg-gray-700 rounded-full">
                <button onClick={() => setSelectedCategoryFilter(cat.id)} className={`pl-3 pr-2 py-1 text-sm rounded-l-full transition-colors ${selectedCategoryFilter === cat.id ? 'bg-blue-600 text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                  {cat.name}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteAssetCategory(cat.id, cat.name); }}
                  title={`Hapus kategori "${cat.name}"`}
                  className={`px-2 py-1 rounded-r-full transition-colors opacity-50 hover:opacity-100 hover:bg-red-200 dark:hover:bg-red-800 ${selectedCategoryFilter === cat.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        {loading ? ( <p className="dark:text-gray-400">Memuat aset...</p> ) : filteredAssets.length === 0 ? ( <p className="dark:text-gray-400">Tidak ada aset yang ditemukan.</p> ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 flex flex-col">
                <div className="relative group">
                  <img src={asset.image_url || 'https://placehold.co/600x400/1F2937/FFFFFF?text=No+Image'} alt={asset.title} className="w-full h-40 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/1F2937/FFFFFF?text=Error'; }}/>
                  <button onClick={() => handleOpenImageModal(asset)} className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="Ubah Gambar"><CameraIcon/></button>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg dark:text-white mb-2 truncate">{asset.title}</h3>
                  {asset.asset_categories && (
                    <span className="text-xs font-medium mb-2 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 self-start">
                        {asset.asset_categories.name}
                    </span>
                  )}
                  <div className="mt-auto pt-2 flex gap-2">
                    <Link to={`/asset/${asset.id}`} className="flex-grow text-center block px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">Detail</Link>
                    <button onClick={() => handleDeleteAsset(asset)} className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (<ImageEditModal asset={selectedAsset} onClose={handleCloseImageModal} onSaveSuccess={handleImageUpdateSuccess}/>)}
    </>
  );
}

export default PlaygroundPage;
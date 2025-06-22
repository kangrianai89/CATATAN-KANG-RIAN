import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

function PlaygroundPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  
  // State baru untuk pencarian & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  useEffect(() => {
    // Memicu fetch ulang saat filter kategori berubah
    fetchAssets(); 
  }, [selectedCategoryFilter]);

  useEffect(() => {
    // Mengambil daftar kategori hanya sekali saat komponen dimuat
    fetchCategories();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pages') // Masih menggunakan tabel 'pages' sesuai struktur
        .select(`
          id,
          title,
          created_at,
          external_link,
          image_url,
          category_id,
          categories (id, name)
        `);

      // Terapkan filter kategori di sisi server jika ada yang dipilih
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

  // Filter pencarian berdasarkan judul dilakukan di sisi klien
  const filteredAssets = assets.filter(asset => 
    asset.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Koleksi Aset</h1>
        <Link 
            to="/asset/new" // Mengarahkan ke halaman detail untuk membuat aset baru
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Tambah Aset Baru
        </Link>
      </div>
      
      {/* UI Pencarian & Filter */}
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
                  <div className="mt-auto pt-2">
                    <Link to={`/asset/${asset.id}`} className="w-full text-center block px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">
                      Lihat Detail
                    </Link>
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
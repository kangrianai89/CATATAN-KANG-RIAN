// File: src/pages/WebCollectionPage.jsx
// Status: Halaman daftar koleksi web, kartu sekarang dapat diklik untuk membuka URL di tab baru

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

function WebCollectionPage() {
  const [loading, setLoading] = useState(true);
  const [webLinks, setWebLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Untuk fitur pencarian
  
  useEffect(() => {
    fetchWebLinks();
  }, []);

  const fetchWebLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('web_links')
        .select('*') // Mengambil semua kolom
        .order('created_at', { ascending: false }); // Urutkan berdasarkan waktu pembuatan terbaru

      if (error) throw error;
      setWebLinks(data || []);
    } catch (error) {
      alert("Gagal memuat link web: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus link web ini?")) {
      try {
        const { error } = await supabase
          .from('web_links')
          .delete()
          .eq('id', linkId);

        if (error) throw error;
        setWebLinks(webLinks.filter((link) => link.id !== linkId)); // Hapus dari state
        alert('Link web berhasil dihapus!');
      } catch (error) {
        alert("Gagal menghapus link web: " + error.message);
      }
    }
  };

  // Filter pencarian berdasarkan judul atau keterangan (case-insensitive)
  const filteredLinks = webLinks.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.caption && link.caption.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Koleksi Web Anda</h1>
        <Link 
          to="/web-link/new" // Mengarahkan ke halaman detail untuk membuat link baru
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Tambah Link Baru
        </Link>
      </div>

      {/* UI Pencarian */}
      <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <input 
          type="text"
          placeholder="Cari berdasarkan judul atau keterangan..."
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        {loading ? (
          <p className="dark:text-gray-400">Memuat koleksi web...</p>
        ) : filteredLinks.length === 0 ? (
          <p className="dark:text-gray-400">Tidak ada link web yang ditemukan. Klik "+ Tambah Link Baru" untuk memulai!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link) => (
              // Bungkus seluruh kartu dengan tag <a> untuk membuatnya dapat diklik
              // Gunakan target="_blank" dan rel="noopener noreferrer" untuk keamanan dan membuka tab baru
              <a 
                key={link.id} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border dark:border-gray-700 flex flex-col transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg dark:text-white mb-2 truncate">
                    {link.title} {/* Judul tidak lagi berupa <a> di dalam <a> */}
                  </h3>
                  {link.caption && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{link.caption}</p>
                  )}
                  <p className="text-xs text-blue-500 dark:text-blue-400 mb-4 break-all truncate">{link.url}</p> {/* URL asli */}

                  <div className="mt-auto pt-2 flex justify-end gap-2" onClick={e => e.stopPropagation()}> 
                    {/* onClick e.stopPropagation() untuk mencegah klik tombol memicu klik kartu utama */}
                    <Link 
                      to={`/web-link/${link.id}`} 
                      className="px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200"
                    >
                      Detail & Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteLink(link.id)} 
                      className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default WebCollectionPage;

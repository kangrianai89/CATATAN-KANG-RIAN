// File: src/pages/WebLinkDetailPage.jsx
// Status: Halaman detail untuk menambah dan mengedit link web

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function WebLinkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Tentukan mode berdasarkan ID dari URL
  const isNewLink = id === 'new'; // true jika mode membuat link baru, false jika mengedit yang sudah ada

  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState(null); // Data link yang sedang diedit/dibuat
  
  const [isEditing, setIsEditing] = useState(isNewLink); // Langsung ke mode edit jika link baru
  const [isSaving, setIsSaving] = useState(false);

  // State untuk form edit/input
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    const fetchLink = async () => {
      if (!isNewLink) { // Hanya fetch jika bukan link baru
        setLoading(true);
        try {
          const { data, error } = await supabase.from('web_links').select('*').eq('id', id).single(); 
          if (error) throw error;

          setLinkData(data);
          setEditTitle(data.title || '');
          setEditUrl(data.url || '');
          setEditCaption(data.caption || '');
          setEditDescription(data.description || '');
        } catch (error) {
          alert("Gagal memuat link web: " + error.message);
          navigate('/web-collection'); // Kembali ke koleksi jika link tidak ditemukan atau error
        } finally {
          setLoading(false);
        }
      } else {
        // Jika link baru, tidak perlu fetch, langsung siapkan untuk edit
        setLoading(false);
        setLinkData({ id: 'new' }); // Set linkData ke objek dummy agar tidak null
        // Kosongkan semua field untuk link baru
        setEditTitle('');
        setEditUrl('');
        setEditCaption('');
        setEditDescription('');
      }
    };

    fetchLink();
  }, [id, navigate, isNewLink]); // Tambahkan isNewLink ke dependency array

  const handleSaveLink = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Anda harus login untuk menyimpan link web.");
        setIsSaving(false);
        return;
      }

      let response;
      let error;

      const dataToSave = {
        title: editTitle,
        url: editUrl,
        caption: editCaption,
        description: editDescription,
        user_id: user.id // Penting: tambahkan user_id untuk RLS
      };

      if (isNewLink) {
        // Mode BUAT BARU: Gunakan .insert(), JANGAN kirim ID
        const result = await supabase
          .from('web_links')
          .insert([dataToSave])
          .select()
          .single();
        response = result.data;
        error = result.error;
      } else {
        // Mode UPDATE: Gunakan .update() dan sertakan ID
        const result = await supabase
          .from('web_links')
          .update(dataToSave)
          .eq('id', id)
          .select()
          .single();
        response = result.data;
        error = result.error;
      }

      if (error) throw error;

      setLinkData(response); // Perbarui state dengan data yang tersimpan/diperbarui
      setIsEditing(false); // Keluar dari mode edit setelah berhasil simpan
      alert(`Link web berhasil di${isNewLink ? 'buat' : 'perbarui'}!`);

      if (isNewLink) {
        navigate(`/web-link/${response.id}`); // Arahkan ke URL detail link yang baru dibuat
      }

    } catch (error) {
      alert("Gagal menyimpan link web: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLink = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus link web ini?")) {
      try {
        const { error } = await supabase.from('web_links').delete().eq('id', id);
        if (error) throw error;
        alert('Link web berhasil dihapus!');
        navigate('/web-collection'); // Kembali ke daftar setelah hapus
      } catch (error) {
        alert("Gagal menghapus link web: " + error.message);
      }
    }
  };

  if (loading) return <div className="dark:text-white p-8">Memuat detail link web...</div>;
  if (!linkData && !isNewLink) return <div className="dark:text-white p-8">Link web tidak ditemukan.</div>;

  const renderContent = () => (
    <div className="space-y-6">
      {/* Judul Link */}
      <div>
        <label className="block text-lg font-semibold mb-2 dark:text-white">Judul Link</label>
        {isEditing ? (
          <input 
            type="text" 
            value={editTitle} 
            onChange={(e) => setEditTitle(e.target.value)} 
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            placeholder={isNewLink ? "Judul link baru..." : ""}
            required
          />
        ) : (
          <h2 className="text-xl font-bold dark:text-white">{linkData?.title}</h2>
        )}
      </div>

      {/* URL */}
      <div>
        <label className="block text-lg font-semibold mb-2 dark:text-white">URL</label>
        {isEditing ? (
          <input 
            type="url" 
            value={editUrl} 
            onChange={(e) => setEditUrl(e.target.value)} 
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            placeholder={isNewLink ? "https://example.com" : ""}
            required
          />
        ) : (
          linkData?.url ? (
            <a href={linkData.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
              {linkData.url}
            </a>
          ) : (
            <p className="text-gray-500 italic">Tidak ada URL.</p>
          )
        )}
      </div>

      {/* Keterangan Singkat */}
      <div>
        <label className="block text-lg font-semibold mb-2 dark:text-white">Keterangan Singkat</label>
        {isEditing ? (
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[80px]"
            placeholder="Ringkasan singkat tentang link ini..."
          ></textarea>
        ) : (
          linkData?.caption ? (
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{linkData.caption}</p>
          ) : (
            <p className="text-gray-500 italic">Tidak ada keterangan singkat.</p>
          )
        )}
      </div>

      {/* Deskripsi Lengkap */}
      <div>
        <label className="block text-lg font-semibold mb-2 dark:text-white">Deskripsi Lengkap</label>
        {isEditing ? (
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[150px]"
            placeholder="Penjelasan detail tentang isi atau manfaat link ini..."
          ></textarea>
        ) : (
          linkData?.description ? (
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{linkData.description}</p>
          ) : (
            <p className="text-gray-500 italic">Tidak ada deskripsi lengkap.</p>
          )
        )}
      </div>
    </div>
  );

  return (
    <div>
      <form onSubmit={handleSaveLink}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold dark:text-white">{isNewLink ? 'Tambah Link Web Baru' : 'Edit Link Web'}</h1>
          
          <div className="flex items-center gap-2">
            <Link to="/web-collection" className="text-sm text-blue-500 hover:underline">&larr; Kembali</Link>
            {isEditing ? (
              <>
                <button type="button" onClick={() => {
                  setIsEditing(false);
                  if (isNewLink) navigate('/web-collection'); // Langsung kembali jika batal membuat link baru
                  else {
                      // Reset form ke nilai asli jika batal edit
                      setEditTitle(linkData.title || '');
                      setEditUrl(linkData.url || '');
                      setEditCaption(linkData.caption || '');
                      setEditDescription(linkData.description || '');
                  }
                }} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-gray-400">
                  {isSaving ? (isNewLink ? 'Membuat...' : 'Menyimpan...') : (isNewLink ? 'Buat Link' : 'Simpan')}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Edit</button>
                <button type="button" onClick={handleDeleteLink} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">Hapus</button>
              </>
            )}
          </div>
        </div>
        {renderContent()}
      </form>
    </div>
  );
}

export default WebLinkDetailPage;

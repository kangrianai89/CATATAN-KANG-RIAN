// File: src/pages/AssetDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Editor from '@monaco-editor/react';

function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Tentukan mode berdasarkan ID dari URL
  const isNewAsset = id === 'new'; // true jika mode membuat aset baru, false jika mengedit yang sudah ada

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null); // Akan tetap null jika aset baru
  const [imageUrl, setImageUrl] = useState(null);

  const [isEditing, setIsEditing] = useState(isNewAsset); // Langsung ke mode edit jika aset baru
  const [isSaving, setIsSaving] = useState(false);

  // State untuk form edit
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editCode, setEditCode] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);

  const [editorTheme, setEditorTheme] = useState('light');

  useEffect(() => {
    setEditorTheme(localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'light');

    const fetchAsset = async () => {
      if (!isNewAsset) { // Hanya fetch jika bukan aset baru
        setLoading(true);
        try {
          const { data, error } = await supabase.from('pages').select('*').eq('id', id).single();
          if (error) throw error;

          setAsset(data);
          setEditTitle(data.title || '');
          setEditLink(data.external_link || '');
          setEditCode(data.code || '');

          if (data && data.image_path) {
            const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(data.image_path);
            if (urlData) {
              setImageUrl(urlData.publicUrl);
            }
          }
        } catch (error) {
          alert("Gagal memuat aset: " + error.message);
          navigate('/playground'); // Kembali ke playground jika aset tidak ditemukan atau error
        } finally {
          setLoading(false);
        }
      } else {
        // Jika aset baru, tidak perlu fetch, langsung siapkan untuk edit
        setLoading(false);
        setAsset({ id: 'new' }); // Set asset ke objek dummy agar tidak null, tapi id-nya tetap 'new'
      }
    };

    fetchAsset();

    const handleThemeChange = () => {
      setEditorTheme(localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'light');
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);

  }, [id, navigate, isNewAsset]); // Tambahkan isNewAsset ke dependency array

  const handleFileSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImageFile(e.target.files[0]);
    }
  };

  const handleSaveAsset = async (e) => { // Mengganti nama fungsi agar lebih generik (update/create)
    e.preventDefault();
    setIsSaving(true);
    let newImagePath = asset?.image_path || null; // Gunakan optional chaining dan set default null

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Anda harus login untuk menyimpan aset.");
        setIsSaving(false);
        return;
      }

      // --- LOGIKA UPLOAD GAMBAR (tetap sama) ---
      if (newImageFile) {
        if (!isNewAsset && asset?.image_path) { // Hanya hapus gambar lama jika ini bukan aset baru dan ada gambar lama
          const { error: removeError } = await supabase.storage.from('asset-images').remove([asset.image_path]);
          if (removeError) console.error("Gagal hapus gambar lama:", removeError);
        }

        const fileExt = newImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`; // Path lebih terstruktur dengan user.id
        const { error: uploadError } = await supabase.storage.from('asset-images').upload(fileName, newImageFile);
        if (uploadError) throw uploadError;
        newImagePath = fileName;
      }
      // ------------------------------------

      let response;
      let error;

      const dataToSave = {
        title: editTitle,
        external_link: editLink,
        code: editCode,
        image_path: newImagePath,
        user_id: user.id // Penting: tambahkan user_id untuk RLS
      };

      if (isNewAsset) {
        // Mode BUAT BARU: Gunakan .insert(), JANGAN kirim ID
        const result = await supabase
          .from('pages')
          .insert([dataToSave])
          .select()
          .single();
        response = result.data;
        error = result.error;
      } else {
        // Mode UPDATE: Gunakan .update() dan sertakan ID
        const result = await supabase
          .from('pages')
          .update(dataToSave)
          .eq('id', id)
          .select()
          .single();
        response = result.data;
        error = result.error;
      }

      if (error) throw error;

      setAsset(response); // Perbarui state aset dengan data yang tersimpan/diperbarui
      if (response && response.image_path) {
        const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(response.image_path);
        setImageUrl(urlData.publicUrl);
      }
      setNewImageFile(null); // Reset input file
      if (document.getElementById('edit-file-input')) document.getElementById('edit-file-input').value = ""; // Clear file input visual

      setIsEditing(false); // Keluar dari mode edit setelah berhasil simpan
      alert(`Aset berhasil di${isNewAsset ? 'buat' : 'perbarui'}!`);

      if (isNewAsset) {
        navigate(`/asset/${response.id}`); // Arahkan ke URL detail aset yang baru dibuat
      }

    } catch (error) {
      alert("Gagal menyimpan aset: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };


  if (loading) return <div className="dark:text-white p-8">Memuat detail aset...</div>;
  // Jika aset baru, dan loading sudah false, tampilkan form kosong
  if (!asset && !isNewAsset) return <div className="dark:text-white p-8">Aset tidak ditemukan.</div>;

  const renderContent = () => (
    <div className="space-y-8">
      <div>
        <label className="block text-lg font-semibold mb-2 dark:text-white">Link Generator</label>
        {isEditing ? (
          <input type="url" value={editLink} onChange={(e) => setEditLink(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        ) : (
          asset?.external_link ? <a href={asset.external_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{asset.external_link}</a> : <p className="text-gray-500 italic">Tidak ada link.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2 dark:text-white">Gambar</h2>
        {(imageUrl || newImageFile) && !isEditing && ( // Tampilkan gambar yang ada atau preview gambar baru jika tidak dalam mode edit
            <img src={newImageFile ? URL.createObjectURL(newImageFile) : imageUrl} alt={asset?.title || "Gambar aset"} className="max-w-full md:max-w-lg rounded-lg shadow-md border" />
        )}
        {isEditing && (
          <>
            {(imageUrl || newImageFile) && <img src={newImageFile ? URL.createObjectURL(newImageFile) : imageUrl} alt="Gambar saat ini" className="w-48 h-auto rounded-lg shadow-md border mb-4" />}
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Ganti Gambar (Opsional)</label>
            <input type="file" id="edit-file-input" accept="image/png, image/jpeg, image/gif" onChange={handleFileSelected} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" />
          </>
        )}
        {!imageUrl && !newImageFile && !isEditing && <p className="text-gray-500 italic">Tidak ada gambar.</p>}
      </div>

      <div>
        <label className="block text-lg font-semibold mb-2 dark:text-white">Cuplikan Kode HTML</label>
        <div className="border rounded-lg overflow-hidden dark:border-gray-600">
          <Editor
            height="300px" language="html"
            value={isEditing ? editCode : (asset?.code || '')} // Gunakan optional chaining untuk asset
            onChange={isEditing ? (value) => setEditCode(value || '') : undefined}
            theme={editorTheme}
            options={{ readOnly: !isEditing, minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <form onSubmit={handleSaveAsset}> {/* Menggunakan handleSaveAsset untuk create/update */}
        <div className="flex justify-between items-center mb-6">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-3xl font-bold dark:text-white bg-transparent border-b-2 dark:border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder={isNewAsset ? "Judul Aset Baru..." : ""} // Placeholder khusus untuk mode baru
              required
            />
          ) : (
            <h1 className="text-3xl font-bold dark:text-white">{asset?.title}</h1> // Optional chaining untuk asset
          )}

          <div className="flex items-center gap-2">
            <Link to="/playground" className="text-sm text-blue-500 hover:underline">&larr; Kembali</Link>
            {isEditing ? (
              <>
                <button type="button" onClick={() => {
                  setIsEditing(false);
                  if (isNewAsset) navigate('/playground'); // Langsung kembali jika batal membuat aset baru
                  else {
                      // Reset form ke nilai asli jika batal edit
                      setEditTitle(asset.title || '');
                      setEditLink(asset.external_link || '');
                      setEditCode(asset.code || '');
                      setNewImageFile(null);
                      if(document.getElementById('edit-file-input')) document.getElementById('edit-file-input').value = "";
                  }
                }} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-gray-400">
                  {isSaving ? (isNewAsset ? 'Membuat...' : 'Menyimpan...') : (isNewAsset ? 'Buat Aset' : 'Simpan')}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Edit</button>
            )}
          </div>
        </div>
        {renderContent()}
      </form>
    </div>
  );
}

export default AssetDetailPage;
// File: src/pages/AssetDetailPage.jsx
// PERBAIKAN: Mengganti alert error dengan console.error untuk debugging yang lebih detail.

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Editor from '@monaco-editor/react';
import imageCompression from 'browser-image-compression';

const NEW_ASSET_DRAFT_KEY = 'asset_draft_new_asset';

function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewAsset = id === 'new';
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); 
  const [isEditing, setIsEditing] = useState(isNewAsset);
  const [isSaving, setIsSaving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState(''); 
  const [newImageFile, setNewImageFile] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  
  const [editorTheme, setEditorTheme] = useState('light');

  useEffect(() => {
    const fetchAllCategories = async () => {
        try {
            const { data, error } = await supabase.from('categories').select('id, name').order('name');
            if (error) throw error;
            setAllCategories(data || []);
        } catch (error) {
            console.error("Gagal memuat daftar kategori:", error);
        }
    };
    fetchAllCategories();
  }, []);

  useEffect(() => {
    setEditorTheme(localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'light');

    const fetchAsset = async () => {
      if (!isNewAsset) {
        setLoading(true);
        try {
          const { data, error } = await supabase.from('pages').select('*, categories(id, name)').eq('id', id).single(); 
          if (error) throw error;
          setAsset(data);
          setEditTitle(data.title || '');
          setEditLink(data.external_link || '');
          setEditCode(data.code || '');
          setEditDescription(data.description || '');
          setSelectedCategoryId(data.category_id || '');
          if (data && data.image_path) {
            const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(data.image_path);
            if (urlData) setImageUrl(urlData.publicUrl);
          }
        } catch (error) {
          alert("Gagal memuat aset: " + error.message);
          navigate('/playground');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setAsset({ id: 'new' });
        const savedDraft = sessionStorage.getItem(NEW_ASSET_DRAFT_KEY);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          setEditTitle(draft.title || '');
          setEditLink(draft.link || '');
          setEditCode(draft.code || '');
          setEditDescription(draft.description || '');
          setSelectedCategoryId(draft.categoryId || '');
        } else {
          setEditTitle('');
          setEditLink('');
          setEditCode('');
          setEditDescription('');
          setSelectedCategoryId('');
        }
        setNewImageFile(null);
        setImageUrl(null);
      }
    };
    fetchAsset();
    
    const handleThemeChange = () => setEditorTheme(localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'light');
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [id, navigate, isNewAsset]);

  useEffect(() => {
    if (isNewAsset) {
      const draft = {
        title: editTitle,
        link: editLink,
        code: editCode,
        description: editDescription,
        categoryId: selectedCategoryId,
      };
      sessionStorage.setItem(NEW_ASSET_DRAFT_KEY, JSON.stringify(draft));
    }
  }, [editTitle, editLink, editCode, editDescription, selectedCategoryId, isNewAsset]);

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp' };
    try {
      const compressedFile = await imageCompression(file, options);
      const newFileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
      const finalFile = new File([compressedFile], newFileName, { type: 'image/webp' });
      setNewImageFile(finalFile);
    } catch (error) {
      setNewImageFile(file);
      alert('Gagal mengompres gambar, file asli akan digunakan.');
    }
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
        alert("Harap pilih kategori untuk aset ini.");
        return;
    }
    setIsSaving(true);
    let newImagePath = asset?.image_path || null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login untuk menyimpan aset.");

      if (newImageFile) {
        if (!isNewAsset && asset?.image_path) {
          await supabase.storage.from('asset-images').remove([asset.image_path]);
        }
        const fileExt = newImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('asset-images').upload(fileName, newImageFile);
        if (uploadError) throw uploadError;
        newImagePath = fileName;
      }
      
      const dataToSave = {
        title: editTitle,
        external_link: editLink,
        code: editCode,
        description: editDescription, 
        image_path: newImagePath,
        user_id: user.id,
        category_id: selectedCategoryId,
      };

      let response;
      let error;
      if (isNewAsset) {
        const result = await supabase.from('pages').insert(dataToSave).select().single();
        response = result.data;
        error = result.error;
      } else {
        const result = await supabase.from('pages').update(dataToSave).eq('id', id).select().single();
        response = result.data;
        error = result.error;
      }
      if (error) throw error;
      
      alert(`Aset berhasil di${isNewAsset ? 'buat' : 'perbarui'}!`);
      if (isNewAsset) {
        sessionStorage.removeItem(NEW_ASSET_DRAFT_KEY);
        navigate(`/asset/${response.id}`);
      } else {
        window.location.reload();
      }
      
    } catch (error) {
      // --- PERUBAHAN ADA DI SINI ---
      console.error("GAGAL MENYIMPAN ASET (DETAIL LENGKAP):", error);
      alert(`Gagal menyimpan aset. Cek console (F12) untuk detail. Pesan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (isNewAsset) {
      sessionStorage.removeItem(NEW_ASSET_DRAFT_KEY); 
      navigate('/playground');
    } else {
        setEditTitle(asset.title || '');
        setEditLink(asset.external_link || '');
        setEditCode(asset.code || '');
        setEditDescription(asset.description || '');
        setSelectedCategoryId(asset.category_id || '');
        setNewImageFile(null);
    }
  };

  if (loading) return <div className="dark:text-white p-8">Memuat detail aset...</div>;
  if (!asset && !isNewAsset) return <div className="dark:text-white p-8">Aset tidak ditemukan.</div>;

  const renderContent = () => (
    <div className="space-y-8">
        {isEditing && (
            <div>
                <label className="block text-lg font-semibold mb-2 dark:text-white">Kategori</label>
                <select 
                    value={selectedCategoryId} 
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="" disabled>-- Pilih Kategori --</option>
                    {allCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
        )}
        <div>
            <label className="block text-lg font-semibold mb-2 dark:text-white">Link Generator</label>
            {isEditing ? (
            <input type="url" value={editLink} onChange={(e) => setEditLink(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://contoh.com (Opsional)"/>
            ) : (
            asset?.external_link ? <a href={asset.external_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{asset.external_link}</a> : <p className="text-gray-500 italic">Tidak ada link.</p>
            )}
        </div>
        <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="md:w-1/2">
                <h2 className="text-xl font-semibold mb-2 dark:text-white">Gambar</h2>
                {(imageUrl || (newImageFile && URL.createObjectURL(newImageFile))) && !isEditing && (
                    <img src={newImageFile ? URL.createObjectURL(newImageFile) : imageUrl} alt={asset?.title || "Gambar aset"} className="max-w-full rounded-lg shadow-md border" />
                )}
                {isEditing && (
                    <>
                    {(imageUrl || (newImageFile && URL.createObjectURL(newImageFile))) && <img src={newImageFile ? URL.createObjectURL(newImageFile) : imageUrl} alt="Gambar saat ini" className="w-48 h-auto rounded-lg shadow-md border mb-4" />}
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Ganti Gambar (Opsional)</label>
                    <input type="file" id="edit-file-input" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleFileSelected} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" />
                    </>
                )}
                {!imageUrl && !newImageFile && !isEditing && <p className="text-gray-500 italic">Tidak ada gambar.</p>}
            </div>
            <div className="md:w-1/2">
            <label className="block text-lg font-semibold mb-2 dark:text-white">Keterangan/Deskripsi</label>
            {isEditing ? (
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[300px]" placeholder="Tambahkan keterangan..."></textarea>
            ) : (
                <textarea value={asset?.description || ''} readOnly className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[300px] resize-none" placeholder="Tidak ada keterangan."></textarea>
            )}
            </div>
        </div>
        <div>
            <label className="block text-lg font-semibold mb-2 dark:text-white">Cuplikan Kode HTML</label>
            <div className="border rounded-lg overflow-hidden dark:border-gray-600">
            <Editor height="300px" language="html" value={isEditing ? editCode : (asset?.code || '')} onChange={isEditing ? (value) => setEditCode(value || '') : undefined} theme={editorTheme} options={{ readOnly: !isEditing, minimap: { enabled: false }, fontSize: 14 }} />
            </div>
        </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        {isEditing ? (
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-3xl font-bold dark:text-white bg-transparent border-b-2 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full" placeholder={isNewAsset ? "Judul Aset Baru..." : ""} required/>
        ) : (
          <h1 className="text-3xl font-bold dark:text-white">{asset?.title}</h1>
        )}
      </div>
      <form onSubmit={handleSaveAsset}>
        {renderContent()}
        <div className="mt-8 pt-6 border-t dark:border-gray-700 flex justify-end items-center gap-2">
            <Link to="/playground" className="text-sm text-blue-500 hover:underline">← Kembali ke Koleksi</Link>
            {isEditing ? (
              <>
                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-gray-400">
                  {isSaving ? (isNewAsset ? 'Membuat...' : 'Menyimpan...') : (isNewAsset ? 'Buat Aset' : 'Simpan')}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">Edit</button>
            )}
        </div>
      </form>
    </div>
  );
}

export default AssetDetailPage;
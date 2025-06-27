import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Editor from '@monaco-editor/react';
import imageCompression from 'browser-image-compression';

const DRAFT_KEY_PREFIX = 'asset_draft_';

function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewAsset = id === 'new';
  const DRAFT_KEY = isNewAsset ? 'asset_draft_new_asset' : `${DRAFT_KEY_PREFIX}${id}`;
  
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); 
  const [isEditing, setIsEditing] = useState(isNewAsset);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState(''); 
  const [newImageFile, setNewImageFile] = useState(null);
  const [selectedAssetCategoryId, setSelectedAssetCategoryId] = useState('');
  const [allAssetCategories, setAllAssetCategories] = useState([]);
  const [editorTheme, setEditorTheme] = useState('light');
  const [generatorLinks, setGeneratorLinks] = useState([{ name: '', url: '' }]);
  const [codeSnippets, setCodeSnippets] = useState([{ title: '', code: '' }]);

  useEffect(() => {
    const fetchAssetCategories = async () => {
      try {
        const { data, error } = await supabase.from('asset_categories').select('id, name').order('name');
        if (error) throw error;
        setAllAssetCategories(data || []);
      } catch (error) { console.error("Gagal memuat kategori aset:", error); }
    };
    fetchAssetCategories();
  }, []);

  useEffect(() => {
    setEditorTheme(localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'light');

    const fetchOrLoadDraft = async () => {
      setLoading(true);
      const savedDraft = localStorage.getItem(DRAFT_KEY);

      // --- PERBAIKAN LOGIKA UTAMA DI SINI ---
      // Jika ada draf, selalu muat draf tersebut.
      if (savedDraft) {
        console.log("Memuat draf dari localStorage...");
        const draft = JSON.parse(savedDraft);
        setEditTitle(draft.title || '');
        setEditDescription(draft.description || '');
        setSelectedAssetCategoryId(draft.assetCategoryId || '');
        setGeneratorLinks(draft.generatorLinks && draft.generatorLinks.length > 0 ? draft.generatorLinks : [{ name: '', url: '' }]);
        setCodeSnippets(draft.codeSnippets && draft.codeSnippets.length > 0 ? draft.codeSnippets : [{ title: '', code: '' }]);
        
        // Kita tetap perlu data asli aset untuk perbandingan saat batal edit,
        // dan untuk mengambil URL gambar yang ada.
        if (!isNewAsset) {
            const { data, error } = await supabase.from('pages').select('*').eq('id', id).single();
            if (error) {
                console.error("Error mengambil data asli saat draf ada:", error);
            } else if (data) {
                setAsset(data);
                if (data.image_path) {
                    const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(data.image_path);
                    if (urlData) setImageUrl(urlData.publicUrl);
                }
            }
        } else {
            setAsset({ id: 'new' });
        }
        setIsEditing(true); // Masuk ke mode edit jika ada draf
      } else {
        // Jika tidak ada draf, baru ambil dari database
        try {
            if (!isNewAsset) {
                const { data, error } = await supabase.from('pages').select('*').eq('id', id).single(); 
                if (error) throw error;
                setAsset(data);
                setEditTitle(data.title || '');
                setEditDescription(data.description || '');
                setSelectedAssetCategoryId(data.asset_category_id || '');
                setGeneratorLinks(data.generator_links && data.generator_links.length > 0 ? data.generator_links : [{ name: '', url: '' }]);
                setCodeSnippets(data.code_snippets && data.code_snippets.length > 0 ? data.code_snippets : [{ title: '', code: '' }]);
                if (data && data.image_path) {
                    const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(data.image_path);
                    if (urlData) setImageUrl(urlData.publicUrl);
                }
            } else { // Inisialisasi untuk aset baru
                setEditTitle(''); 
                setEditDescription(''); 
                setSelectedAssetCategoryId(''); 
                setGeneratorLinks([{ name: '', url: '' }]);
                setCodeSnippets([{ title: '', code: '' }]);
            }
        } catch (error) {
            alert("Gagal memuat aset: " + error.message);
            navigate('/playground');
        }
      }
      setLoading(false);
    };
    fetchOrLoadDraft();
    
    const handleThemeChange = () => setEditorTheme(localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'light');
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [id, navigate, isNewAsset, DRAFT_KEY]);

  useEffect(() => {
    if (isEditing && !loading) {
      const draft = {
        title: editTitle,
        description: editDescription,
        assetCategoryId: selectedAssetCategoryId,
        generatorLinks: generatorLinks,
        codeSnippets: codeSnippets,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [editTitle, editDescription, selectedAssetCategoryId, generatorLinks, codeSnippets, isEditing, loading, DRAFT_KEY]);

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
  
  const handleLinkChange = (index, field, value) => {
    const newLinks = [...generatorLinks];
    newLinks[index][field] = value;
    setGeneratorLinks(newLinks);
  };

  const handleAddLink = () => {
    setGeneratorLinks([...generatorLinks, { name: '', url: '' }]);
  };

  const handleRemoveLink = (index) => {
    if (generatorLinks.length === 1 && generatorLinks[0].name === '' && generatorLinks[0].url === '') { return; }
    if (generatorLinks.length === 1) { setGeneratorLinks([{ name: '', url: '' }]); return; }
    const newLinks = generatorLinks.filter((_, i) => i !== index);
    setGeneratorLinks(newLinks);
  };

  const handleSnippetChange = (index, field, value) => {
    const newSnippets = [...codeSnippets];
    newSnippets[index][field] = value;
    setCodeSnippets(newSnippets);
  };

  const handleAddSnippet = () => {
    setCodeSnippets([...codeSnippets, { title: '', code: '' }]);
  };

  const handleRemoveSnippet = (index) => {
    const newSnippets = codeSnippets.filter((_, i) => i !== index);
    setCodeSnippets(newSnippets);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!selectedAssetCategoryId) {
        alert("Harap pilih kategori untuk aset ini.");
        return;
    }
    setIsSaving(true);
    let newImagePath = asset?.image_path || null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login untuk menyimpan aset.");

      if (newImageFile) {
        if (!isNewAsset && asset?.image_path) { await supabase.storage.from('asset-images').remove([asset.image_path]); }
        const fileExt = newImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('asset-images').upload(fileName, newImageFile);
        if (uploadError) throw uploadError;
        newImagePath = fileName;
      }
      
      const finalLinks = generatorLinks.filter(link => link.url && link.url.trim() !== '');
      const finalSnippets = codeSnippets.filter(snippet => snippet.code && snippet.code.trim() !== '');

      const dataToSave = {
        title: editTitle,
        description: editDescription, 
        image_path: newImagePath,
        user_id: user.id,
        asset_category_id: selectedAssetCategoryId,
        generator_links: finalLinks,
        code_snippets: finalSnippets,
      };

      const { data, error } = isNewAsset
        ? await supabase.from('pages').insert(dataToSave).select().single()
        : await supabase.from('pages').update(dataToSave).eq('id', id).select().single();

      if (error) throw error;
      
      alert(`Aset berhasil di${isNewAsset ? 'buat' : 'perbarui'}!`);
      localStorage.removeItem(DRAFT_KEY);
      
      if (isNewAsset) {
        navigate(`/asset/${data.id}`);
      } else {
        setIsEditing(false);
        setAsset(data);
        if (newImagePath) {
           const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(newImagePath);
           if(urlData) setImageUrl(urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error("GAGAL MENYIMPAN ASET (DETAIL LENGKAP):", error);
      alert(`Gagal menyimpan aset. Cek console (F12) untuk detail. Pesan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    localStorage.removeItem(DRAFT_KEY);
    if (isNewAsset) {
      navigate('/playground');
    } else {
      setEditTitle(asset.title || '');
      setEditDescription(asset.description || '');
      setSelectedAssetCategoryId(asset.asset_category_id || '');
      setGeneratorLinks(asset.generator_links && asset.generator_links.length > 0 ? asset.generator_links : [{ name: '', url: '' }]);
      setCodeSnippets(asset.code_snippets && asset.code_snippets.length > 0 ? asset.code_snippets : [{ title: '', code: '' }]);
      setNewImageFile(null);
    }
  };

  if (loading) return <div className="dark:text-white p-8">Memuat detail aset...</div>;
  if (!asset && !isNewAsset && !DRAFT_KEY) return <div className="dark:text-white p-8">Aset tidak ditemukan.</div>;

  const renderContent = () => (
    <div className="space-y-8">
      {isEditing && ( <div> <label className="block text-lg font-semibold mb-2 dark:text-white">Kategori Aset</label> <select value={selectedAssetCategoryId} onChange={(e) => setSelectedAssetCategoryId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"> <option value="" disabled>-- Pilih Kategori --</option> {allAssetCategories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))} </select> </div> )}
      <div> <label className="block text-lg font-semibold mb-2 dark:text-white">Link Generator (Opsional)</label> {isEditing ? ( <div className="space-y-3 p-4 border rounded-lg dark:border-gray-600"> {generatorLinks.map((link, index) => ( <div key={index} className="flex flex-col sm:flex-row items-center gap-2"> <input type="text" value={link.name} onChange={(e) => handleLinkChange(index, 'name', e.target.value)} placeholder="Nama Link (misal: Demo)" className="w-full sm:w-1/3 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/> <input type="url" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} placeholder="https://..." className="w-full sm:flex-grow px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/> <button type="button" onClick={() => handleRemoveLink(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full w-full sm:w-auto mt-2 sm:mt-0">Hapus</button> </div> ))} <button type="button" onClick={handleAddLink} className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">+ Tambah Link</button> </div> ) : ( asset?.generator_links && asset.generator_links.length > 0 ? ( <ul className="list-disc list-inside pl-5 space-y-1"> {asset.generator_links.map((link, index) => ( <li key={index}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{link.name || link.url}</a></li> ))} </ul> ) : <p className="text-gray-500 italic">Tidak ada link.</p> )} </div>
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        <div className="md:w-1/2">
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Gambar</h2>
            {(imageUrl || (newImageFile && URL.createObjectURL(newImageFile))) && !isEditing ? ( <img src={newImageFile ? URL.createObjectURL(newImageFile) : imageUrl} alt={asset?.title || "Gambar aset"} className="max-w-full rounded-lg shadow-md border" /> ) : null }
            {isEditing && ( <> {(imageUrl || (newImageFile && URL.createObjectURL(newImageFile))) && <img src={newImageFile ? URL.createObjectURL(newImageFile) : imageUrl} alt="Gambar saat ini" className="w-48 h-auto rounded-lg shadow-md border mb-4" />} <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Ganti Gambar (Opsional)</label> <input type="file" id="edit-file-input" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleFileSelected} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" /> </> )}
            {!imageUrl && !newImageFile && !isEditing && <p className="text-gray-500 italic">Tidak ada gambar.</p>}
        </div>
        <div className="w-full md:w-1/2">
            <label className="block text-lg font-semibold mb-2 dark:text-white">Keterangan/Deskripsi</label>
            {isEditing ? ( <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[300px]" placeholder="Tambahkan keterangan..."></textarea> ) : ( <textarea value={asset?.description || ''} readOnly className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[300px] resize-none" placeholder="Tidak ada keterangan."></textarea> )}
        </div>
      </div>
      <div>
        <label className="block text-lg font-semibold mb-2 dark:text-white">Cuplikan Kode</label>
        {isEditing ? (
            <div className="space-y-4">
                {codeSnippets.map((snippet, index) => (
                    <div key={index} className="p-4 border rounded-lg dark:border-gray-600 space-y-2">
                         <div className="flex justify-between items-center">
                            <input type="text" value={snippet.title} onChange={(e) => handleSnippetChange(index, 'title', e.target.value)} placeholder="Judul Cuplikan Kode..." className="text-md font-semibold bg-transparent w-full focus:outline-none dark:text-white px-2 py-1 border-b dark:border-gray-500"/>
                            <button type="button" onClick={() => handleRemoveSnippet(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">&times;</button>
                        </div>
                        <div className="border rounded-lg overflow-hidden dark:border-gray-600">
                            <Editor height="200px" language="html" value={snippet.code} onChange={(value) => handleSnippetChange(index, 'code', value || '')} theme={editorTheme} options={{ minimap: { enabled: false }, fontSize: 14 }} />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={handleAddSnippet} className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">+ Tambah Cuplikan Kode</button>
            </div>
        ) : (
            asset?.code_snippets && asset.code_snippets.length > 0 ? (
                <div className="space-y-4">
                    {asset.code_snippets.map((snippet, index) => (
                        <div key={index}>
                            {snippet.title && <h3 className="text-md font-semibold mb-1 dark:text-white">{snippet.title}</h3>}
                            <div className="border rounded-lg overflow-hidden dark:border-gray-600">
                                <Editor height="200px" language="html" value={snippet.code} theme={editorTheme} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-500 italic">Tidak ada cuplikan kode.</p>
        )}
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
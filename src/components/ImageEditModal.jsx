import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression';

const Spinner = () => ( <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> );

function ImageEditModal({ asset, onClose, onSaveSuccess }) {
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!asset) return null;

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp' };
    try {
      const compressedFile = await imageCompression(file, options);
      const newFileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
      const finalFile = new File([compressedFile], newFileName, { type: 'image/webp' });
      setNewImageFile(finalFile);
      setPreviewUrl(URL.createObjectURL(finalFile));
    } catch (err) {
      setError('Gagal mengompres gambar. Coba file lain.');
      console.error('Gagal kompresi:', err);
    }
  };

  const handleSaveImage = async () => {
    if (!newImageFile) {
      setError('Silakan pilih file gambar terlebih dahulu.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const BUCKET_NAME = 'asset-images';
      if (asset.image_path) {
        await supabase.storage.from(BUCKET_NAME).remove([asset.image_path]);
      }
      const fileExt = newImageFile.name.split('.').pop();
      const newImagePath = `${asset.user_id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(newImagePath, newImageFile);
      if (uploadError) throw uploadError;

      const { data: updatedAsset, error: updateError } = await supabase
        .from('pages')
        .update({ image_path: newImagePath })
        .eq('id', asset.id)
        .select('id, image_path')
        .single();
      
      if (updateError || !updatedAsset) {
        throw updateError || new Error("Update ke database tidak mengembalikan data. Kemungkinan tidak ada baris yang cocok atau RLS Policy menghalangi.");
      }
      
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(updatedAsset.image_path);
      onSaveSuccess(asset.id, urlData.publicUrl, updatedAsset.image_path);
      
      onClose();
    } catch (err) {
      console.error("--- PROSES SIMPAN GAGAL DI BLOK CATCH ---", err);
      setError(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"><h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ubah Gambar Aset</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-3xl leading-none">&times;</button></div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pilih gambar baru untuk aset: <span className="font-bold">{asset.title}</span></p>
                <div><label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">File Gambar Baru</label><input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleFileSelected} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"/></div>
                {previewUrl && (<div className="mt-4"><p className="text-sm font-medium mb-2 dark:text-gray-300">Preview:</p><img src={previewUrl} alt="Preview gambar baru" className="max-w-xs max-h-48 rounded-lg shadow-md border" /></div>)}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-500">Batal</button><button onClick={handleSaveImage} disabled={isSaving || !newImageFile} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center">{isSaving ? <><Spinner />Menyimpan...</> : 'Simpan Gambar'}</button></div>
        </div>
    </div>
  );
}

export default ImageEditModal;
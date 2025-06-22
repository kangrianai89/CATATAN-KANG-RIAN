import { useState } from 'react';
// 1. Impor supabase untuk mengakses database
import { supabase } from '../supabaseClient';

function ImageReaderPage() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setExtractedText('');
      setError('');
    }
  };

  // 2. Tambahkan fungsi untuk mengambil API Key
  const getApiKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak ditemukan.");

    const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single();
    
    if (profile && profile.gemini_api_key) {
        return profile.gemini_api_key;
    }
    
    const mainApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (mainApiKey) {
        return mainApiKey;
    }

    throw new Error("API Key belum diatur. Silakan atur di halaman Pengaturan Akun atau konfigurasikan kunci utama aplikasi.");
  };

  const handleExtractText = async () => {
    if (!imageFile) {
      setError('Silakan pilih gambar terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = async () => {
        try {
            // 3. Ambil kunci yang sesuai sebelum memanggil API
            const apiKey = await getApiKey(); 
            
            const base64Image = reader.result.split(',')[1];
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{
                    parts: [
                        { text: "Transkripsikan seluruh teks yang ada di dalam gambar ini. Setelah itu, perbaiki semua kesalahan ejaan dan tata bahasa, lalu format hasilnya dengan rapi menggunakan paragraf dan baris baru yang sesuai." },
                        { inline_data: { mime_type: imageFile.type, data: base64Image } }
                    ]
                }]
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API request failed: ${errorBody.error.message}`);
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            setExtractedText(text);

        } catch (err) {
            console.error(err);
            setError('Gagal mengekstrak teks: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };
    reader.onerror = () => {
        setError('Gagal membaca file gambar.');
        setIsLoading(false);
    };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText).then(() => {
        alert('Teks berhasil disalin!');
    }, () => {
        alert('Gagal menyalin teks.');
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Ekstraktor Teks dari Gambar</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kolom Kiri: Upload & Preview */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Langkah 1: Unggah Gambar</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Pilih file gambar (JPG, PNG, WebP) yang berisi teks untuk dibaca.</p>
            <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-300 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"/>
          </div>
          
          {imagePreview && (
            <div className="p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Preview Gambar</h3>
                <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-contain rounded-md" />
            </div>
          )}
          
          <button onClick={handleExtractText} disabled={!imageFile || isLoading} className="w-full px-4 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
            {isLoading ? 'Membaca Teks...' : 'Langkah 2: Ekstrak Teks'}
          </button>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold dark:text-white">Langkah 3: Hasil Teks</h2>
            {extractedText && (
                <button onClick={handleCopy} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">Salin Teks</button>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <textarea
            readOnly
            value={isLoading ? 'Sedang memproses, harap tunggu...' : extractedText}
            placeholder="Hasil teks yang diekstrak akan muncul di sini..."
            className="w-full h-96 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
    </>
  );
}

export default ImageReaderPage;
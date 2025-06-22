import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ChevronIcon = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
);

function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkForKey = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single();
            if (data && data.gemini_api_key) {
                setHasKey(true);
            }
        }
        setLoading(false);
    };
    checkForKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak ditemukan.");
      const { error } = await supabase.from('profiles').update({ gemini_api_key: apiKey }).eq('id', user.id);
      if (error) throw error;
      setMessage('API Key berhasil disimpan.');
      setHasKey(true);
      setApiKey('');
    } catch (error) {
      setMessage('Gagal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (window.confirm("Yakin ingin menghapus API Key yang tersimpan? Fitur AI akan menggunakan kunci utama aplikasi (jika ada) atau berhenti berfungsi.")) {
        setLoading(true);
        setMessage('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Pengguna tidak ditemukan.");
            const { error } = await supabase.from('profiles').update({ gemini_api_key: null }).eq('id', user.id);
            if (error) throw error;
            setMessage('API Key berhasil dihapus.');
            setHasKey(false);
        } catch (error) {
            setMessage('Gagal: ' + error.message);
        } finally {
            setLoading(false);
        }
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Pengaturan Akun</h1>
      <div className="max-w-2xl">
        <div className="p-6 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">API Key Google Gemini Pribadi</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Masukkan API Key Gemini Anda di sini. Kunci ini akan digunakan khusus untuk fitur AI saat Anda login dengan akun ini, sehingga tidak membebani limit utama aplikasi.
          </p>
          
          {hasKey ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-lg text-center">
              <p className="font-semibold text-green-800 dark:text-green-200">API Key pribadi Anda sudah tersimpan.</p>
              <button onClick={handleRemoveApiKey} className="mt-2 text-sm text-red-500 hover:underline" disabled={loading}>
                {loading ? 'Menghapus...' : 'Hapus Kunci'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input type="password" placeholder="Masukkan API Key Anda..." className="flex-grow px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              <button onClick={handleSaveApiKey} disabled={loading || !apiKey} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          )}
          {message && <p className={`text-sm mt-4 ${message.includes('Gagal') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        </div>
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 shadow-sm dark:bg-gray-800/50 dark:border-gray-700">
          <button onClick={() => setIsGuideOpen(!isGuideOpen)} className="w-full flex justify-between items-center text-left font-semibold text-gray-700 dark:text-gray-200">
            <span>Bagaimana Cara Mendapatkan API Key?</span>
            <ChevronIcon isOpen={isGuideOpen} />
          </button>
          {isGuideOpen && ( <div className="mt-4 prose prose-sm dark:prose-invert max-w-none"><ol className="list-decimal pl-5 space-y-2"><li>Buka halaman <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio API Keys</a>.</li><li>Klik tombol <strong>"Create API key in new project"</strong>.</li><li>Salin seluruh teks acak yang muncul di bawah kolom "API key".</li><li>Tempelkan kunci tersebut ke dalam kolom input di atas dan klik "Simpan".</li></ol></div>)}
        </div>
      </div>
    </>
  );
}
export default SettingsPage;
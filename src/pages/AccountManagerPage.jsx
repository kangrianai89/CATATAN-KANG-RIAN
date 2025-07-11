// src/pages/AccountManagerPage.jsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ReauthGuard from '../components/ReauthGuard';

// --- Daftar Platform Default ---
const defaultPlatforms = [
  'Google', 'Facebook', 'Instagram', 'Tiktok', 'Shopee', 
  'Tokopedia', 'Lazada', 'Github', 'Gitlab', 'Lainnya...'
];

function AccountManagerPage({ session }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // State untuk input form
  const [formPlatform, setFormPlatform] = useState(defaultPlatforms[0]);
  const [formCustomPlatform, setFormCustomPlatform] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('platform', { ascending: true });
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      alert("Gagal memuat daftar akun: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAndCloseForm = () => {
    setIsFormVisible(false);
    setEditingAccount(null);
    setFormPlatform(defaultPlatforms[0]);
    setFormCustomPlatform('');
    setFormUsername('');
    setFormNotes('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let finalPlatform = formPlatform;
    if (formPlatform === 'Lainnya...') {
      if (!formCustomPlatform.trim()) return alert("Harap isi nama platform kustom.");
      finalPlatform = formCustomPlatform.trim();
    }
    if (!finalPlatform || !formUsername.trim()) return alert("Platform dan Username tidak boleh kosong.");
    
    try {
      const dataToSave = { platform: finalPlatform, username: formUsername, notes: formNotes, user_id: session.user.id };
      let savedData, error;

      if (editingAccount) {
        ({ data: savedData, error } = await supabase.from('accounts').update(dataToSave).eq('id', editingAccount.id).select().single());
      } else {
        ({ data: savedData, error } = await supabase.from('accounts').insert(dataToSave).select().single());
      }
      if (error) throw error;
        
      if (editingAccount) {
        setAccounts(accounts.map(acc => acc.id === savedData.id ? savedData : acc).sort((a,b) => a.platform.localeCompare(b.platform)));
      } else {
        setAccounts([...accounts, savedData].sort((a,b) => a.platform.localeCompare(b.platform)));
      }
      resetAndCloseForm();
    } catch (error) {
      alert("Gagal menyimpan akun: " + error.message);
    }
  };

  const handleDelete = async (accountId) => {
    if (window.confirm("Yakin ingin menghapus akun ini dari daftar?")) {
        try {
            await supabase.from('accounts').delete().eq('id', accountId);
            setAccounts(accounts.filter(acc => acc.id !== accountId));
        } catch (error) {
            alert("Gagal menghapus akun: " + error.message);
        }
    }
  };
  
  // === FUNGSI YANG DIPERBAIKI ===
  const handleOpenEditForm = (account) => {
    setEditingAccount(account); // Tandai bahwa kita sedang dalam mode edit

    // Langsung isi state form dengan data dari akun yang dipilih
    if (defaultPlatforms.includes(account.platform)) {
      setFormPlatform(account.platform);
      setFormCustomPlatform('');
    } else {
      setFormPlatform('Lainnya...');
      setFormCustomPlatform(account.platform);
    }
    setFormUsername(account.username);
    setFormNotes(account.notes || '');

    setIsFormVisible(true); // Tampilkan form setelah semua data siap
  };

  const groupedAccounts = accounts.reduce((acc, account) => {
    const platform = account.platform || 'Tanpa Platform';
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(account);
    return acc;
  }, {});

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Manajer Akun</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola semua akun media sosial dan platform Anda.</p>
          </div>
      </div>
      
      <ReauthGuard session={session}>
        {!isFormVisible && (
            <button 
                onClick={() => { setEditingAccount(null); resetAndCloseForm(); setIsFormVisible(true); }}
                className="px-4 py-2 mb-8 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors flex-shrink-0"
            >
                + Tambah Akun Baru
            </button>
        )}

        {isFormVisible && (
          <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="text-xl font-semibold dark:text-white">{editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700">
                    {defaultPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {formPlatform === 'Lainnya...' && (
                    <input type="text" placeholder="Nama Platform" required value={formCustomPlatform} onChange={(e) => setFormCustomPlatform(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"/>
                  )}
                </div>
                <input type="text" placeholder="Username / Email" required value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <textarea placeholder="Catatan (e.g., Hint password, tanggal lahir)" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows="3" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"></textarea>
              <div className="flex gap-4">
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Simpan</button>
                  <button type="button" onClick={resetAndCloseForm} className="px-4 py-2 bg-gray-200 text-black dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300">Batal</button>
              </div>
            </form>
          </div>
        )}

        {loading ? ( <p className="dark:text-gray-400">Memverifikasi...</p> ) : accounts.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="dark:text-gray-400">Belum ada akun yang ditambahkan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedAccounts).map(platform => (
              <div key={platform}>
                <h3 className="text-lg font-bold border-b-2 border-purple-500 pb-1 mb-3 dark:text-white">{platform}</h3>
                <div className="space-y-3">
                  {groupedAccounts[platform].map(account => (
                    <div key={account.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{account.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{account.notes || 'Tidak ada catatan'}</p>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                        <button onClick={() => handleOpenEditForm(account)} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200">EDIT</button>
                        <button onClick={() => handleDelete(account.id)} className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200">HAPUS</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ReauthGuard>
    </>
  );
}

export default AccountManagerPage;
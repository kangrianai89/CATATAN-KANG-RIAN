import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EmailManagerPage() {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null); 

  const [formEmail, setFormEmail] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formType, setFormType] = useState('Biasa');
  const [formKeterangan, setFormKeterangan] = useState('');

  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (editingEmail) {
      setFormEmail(editingEmail.email_address);
      setFormNickname(editingEmail.nickname || '');
      setFormType(editingEmail.account_type);
      setFormKeterangan(editingEmail.keterangan || '');
    }
  }, [editingEmail]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      alert("Gagal memuat daftar email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAndCloseForm = () => {
    setIsFormVisible(false);
    setEditingEmail(null);
    setFormEmail('');
    setFormNickname('');
    setFormType('Biasa');
    setFormKeterangan('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formEmail.trim()) return alert("Alamat email tidak boleh kosong.");

    // === LOGIKA VALIDASI DUPLIKAT BARU ===
    // Cek apakah email sudah ada (case-insensitive), kecuali jika sedang mengedit email yang sama.
    const isDuplicate = emails.some(email => 
        email.email_address.toLowerCase() === formEmail.trim().toLowerCase() && 
        email.id !== editingEmail?.id
    );

    if (isDuplicate) {
        alert('Email ini sudah ada di dalam daftar!');
        return; // Hentikan proses penyimpanan
    }
    // ===================================
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let savedData;
      let error;

      const dataToSave = {
        email_address: formEmail,
        nickname: formNickname,
        account_type: formType,
        keterangan: formKeterangan,
        user_id: user.id
      };
      
      if (editingEmail) {
        const { data, error: updateError } = await supabase
            .from('email_accounts')
            .update(dataToSave)
            .eq('id', editingEmail.id)
            .select()
            .single();
        savedData = data;
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase
            .from('email_accounts')
            .insert(dataToSave)
            .select()
            .single();
        savedData = data;
        error = insertError;
      }

      if (error) throw error;
        
      if (editingEmail) {
        setEmails(emails.map(e => e.id === savedData.id ? savedData : e));
      } else {
        setEmails([savedData, ...emails]);
      }
      resetAndCloseForm();

    } catch (error) {
        alert("Gagal menyimpan email: " + error.message);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    if (window.confirm("Yakin ingin menghapus email ini dari daftar?")) {
        try {
            await supabase.from('email_accounts').delete().eq('id', emailId);
            setEmails(emails.filter(email => email.id !== emailId));
        } catch (error) {
            alert("Gagal menghapus email: " + error.message);
        }
    }
  };
  
  const handleOpenEditForm = (email) => {
    setEditingEmail(email);
    setIsFormVisible(true);
  };
  
  const handleCopy = (emailAddress) => {
    const url = `https://mail.google.com/mail/u/?authuser=${emailAddress}`;
    navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(emailAddress); 
        setTimeout(() => setCopySuccess(''), 2000); 
    });
  };

  const totalCount = emails.length;
  const biasaCount = emails.filter(e => e.account_type === 'Biasa').length;
  const studentCount = emails.filter(e => e.account_type === 'Student').length;
  const flowCount = emails.filter(e => e.account_type === 'Flow').length;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Manajer Email</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola semua akun email Anda.</p>
          </div>
           {!isFormVisible && (
            <button 
                onClick={() => { setEditingEmail(null); setIsFormVisible(true); }}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors flex-shrink-0"
            >
                + Tambah Email Baru
            </button>
          )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold dark:text-white">{totalCount}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Email</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold dark:text-white">{biasaCount}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tipe Biasa</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold dark:text-white">{studentCount}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tipe Student</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold dark:text-white">{flowCount}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tipe Flow</p>
        </div>
      </div>


      {isFormVisible && (
        <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={handleSave} className="space-y-4">
            <h2 className="text-xl font-semibold dark:text-white">{editingEmail ? 'Edit Akun Email' : 'Tambah Akun Email Baru'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="email" placeholder="Alamat Email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
              <input type="text" placeholder="Nama Panggilan (Opsional)" value={formNickname} onChange={(e) => setFormNickname(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700">
                <option value="Biasa">Biasa</option>
                <option value="Student">Student</option>
                <option value="Flow">Flow</option>
              </select>
            </div>
            <textarea placeholder="Keterangan (Opsional)" value={formKeterangan} onChange={(e) => setFormKeterangan(e.target.value)} rows="2" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"></textarea>
            <div className="flex gap-4">
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Simpan</button>
                <button type="button" onClick={resetAndCloseForm} className="px-4 py-2 bg-gray-200 text-black dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
              <thead>
                  <tr className="border-b dark:border-gray-700">
                      <th className="text-left p-3 px-5 dark:text-gray-200">Email & Keterangan</th>
                      <th className="text-left p-3 px-5 dark:text-gray-200">Tipe</th>
                      <th className="text-right p-3 px-5 dark:text-gray-200">Aksi</th>
                  </tr>
              </thead>
              <tbody>
              {loading ? (
                  <tr><td colSpan="3" className="p-5 text-center dark:text-gray-400">Memuat...</td></tr>
              ) : emails.length === 0 ? (
                  <tr><td colSpan="3" className="p-5 text-center dark:text-gray-400">Belum ada email yang ditambahkan.</td></tr>
              ) : (
                  emails.map(email => (
                      <tr key={email.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-3 px-5">
                              <span className="font-semibold text-blue-500">{email.email_address}</span>
                              {email.nickname && <p className="text-sm text-gray-500 dark:text-gray-400">{email.nickname}</p>}
                              {email.keterangan && <p className="mt-1 text-xs italic text-gray-600 dark:text-gray-300">{email.keterangan}</p>}
                          </td>
                          <td className="p-3 px-5 align-top">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  email.account_type === 'Student' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  email.account_type === 'Flow' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                }`}>{email.account_type}</span>
                          </td>
                          <td className="p-3 px-5 text-right flex justify-end items-center gap-2 align-top">
                              <button onClick={() => handleOpenEditForm(email)} className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-md hover:bg-yellow-200">Edit</button>
                              <button onClick={() => handleDeleteEmail(email.id)} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200">Hapus</button>
                          </td>
                      </tr>
                  ))
              )}
              </tbody>
          </table>
      </div>
    </>
  );
}

export default EmailManagerPage;
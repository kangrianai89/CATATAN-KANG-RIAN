import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function EmailManagerPage() {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  
  // State untuk kontrol form
  const [showAddForm, setShowAddForm] = useState(false);

  // State untuk input di dalam form
  const [newEmail, setNewEmail] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newType, setNewType] = useState('Biasa');
  const [newKeterangan, setNewKeterangan] = useState('');

  // State untuk filter dan notifikasi
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    fetchEmails();
  }, []);

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
  
  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return alert("Alamat email tidak boleh kosong.");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('email_accounts')
            .insert({
                email_address: newEmail,
                nickname: newNickname,
                account_type: newType,
                keterangan: newKeterangan,
                user_id: user.id
            })
            .select()
            .single();
        if (error) throw error;
        setEmails([data, ...emails]);
        
        // Reset dan sembunyikan form
        setNewEmail('');
        setNewNickname('');
        setNewType('Biasa');
        setNewKeterangan('');
        setShowAddForm(false);
    } catch (error) {
        alert("Gagal menambah email: " + error.message);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    if (window.confirm("Yakin ingin menghapus email ini dari daftar?")) {
        try {
            const { error } = await supabase.from('email_accounts').delete().eq('id', emailId);
            if (error) throw error;
            setEmails(emails.filter(email => email.id !== emailId));
        } catch (error) {
            alert("Gagal menghapus email: " + error.message);
        }
    }
  };

  const handleToggleCheck = async (id, currentStatus) => {
    const updatedEmails = emails.map(email =>
        email.id === id ? { ...email, is_checked: !currentStatus } : email
    );
    setEmails(updatedEmails);

    try {
        const { error } = await supabase
            .from('email_accounts')
            .update({ is_checked: !currentStatus })
            .eq('id', id);
        if (error) {
            alert("Gagal menyimpan perubahan: " + error.message);
            setEmails(emails);
        }
    } catch (error) {
        alert("Gagal menyimpan perubahan: " + error.message);
        setEmails(emails);
    }
  };

  const handleCopy = (emailAddress) => {
    const url = `https://mail.google.com/mail/u/?authuser=${emailAddress}`;
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(emailAddress); 
      setTimeout(() => setCopySuccess(''), 2000); 
    } catch (err) {
      console.error('Gagal menyalin link: ', err);
    }
    document.body.removeChild(textArea);
  };

  const filteredEmails = emails.filter(email => 
    typeFilter === 'Semua' || email.account_type === typeFilter
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Manajer Email</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola semua akun email Anda.</p>
          </div>
           {!showAddForm && (
            <button 
                onClick={() => setShowAddForm(true)} 
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors flex-shrink-0"
            >
                + Tambah Email Baru
            </button>
          )}
      </div>

      {showAddForm && (
        <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={handleAddEmail} className="space-y-4">
            <h2 className="text-xl font-semibold dark:text-white">Tambah Akun Email Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="email" placeholder="Alamat Email (contoh@gmail.com)" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <input type="text" placeholder="Nama Panggilan (Opsional)" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} />
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="Biasa">Biasa</option>
                <option value="Student">Student</option>
                <option value="Flow">Flow</option>
              </select>
            </div>
            <textarea
              placeholder="Keterangan (Opsional)"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newKeterangan}
              onChange={(e) => setNewKeterangan(e.target.value)}
              rows="2"
            ></textarea>
            <div className="flex gap-4">
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Tambah ke Daftar</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 text-black dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold dark:text-white">Daftar Email Tersimpan</h2>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="Semua">Filter: Semua</option>
            <option value="Biasa">Biasa</option>
            <option value="Student">Student</option>
            <option value="Flow">Flow</option>
          </select>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <th className="p-3 w-12 text-center dark:text-gray-200">✓</th>
                        <th className="text-left p-3 px-5 dark:text-gray-200">Email & Keterangan</th>
                        <th className="text-left p-3 px-5 dark:text-gray-200">Tipe</th>
                        <th className="text-right p-3 px-5 dark:text-gray-200">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                {loading ? (
                    <tr><td colSpan="4" className="p-5 text-center dark:text-gray-400">Memuat...</td></tr>
                ) : filteredEmails.length === 0 ? (
                    <tr><td colSpan="4" className="p-5 text-center dark:text-gray-400">Tidak ada email yang cocok.</td></tr>
                ) : (
                    filteredEmails.map(email => (
                        <tr key={email.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${email.is_checked ? 'bg-green-50 dark:bg-green-900/30' : ''}`}>
                            <td className="p-3 text-center">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded text-blue-500 focus:ring-blue-500 cursor-pointer"
                                    checked={email.is_checked || false}
                                    onChange={() => handleToggleCheck(email.id, email.is_checked)}
                                />
                            </td>
                            <td className="p-3 px-5">
                                <span className={`font-semibold ${email.is_checked ? 'line-through text-gray-500' : 'text-blue-500'}`}>{email.email_address}</span>
                                {email.nickname && <p className={`text-sm ${email.is_checked ? 'line-through text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>{email.nickname}</p>}
                                {email.keterangan && <p className={`mt-1 text-xs italic ${email.is_checked ? 'line-through text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>{email.keterangan}</p>}
                            </td>
                            <td className="p-3 px-5">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    email.account_type === 'Student' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    email.account_type === 'Flow' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                }`}>
                                    {email.account_type}
                                </span>
                            </td>
                            <td className="p-3 px-5 text-right flex justify-end items-center gap-2">
                                <button onClick={() => handleCopy(email.email_address)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 w-28 text-center">
                                    {copySuccess === email.email_address ? 'Disalin!' : 'Salin Link'}
                                </button>
                                <button onClick={() => handleDeleteEmail(email.id)} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200">Hapus</button>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
      </div>
    </>
  );
}

export default EmailManagerPage;
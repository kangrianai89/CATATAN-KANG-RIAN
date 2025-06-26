import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

function RegisterPage() {
  // State untuk verifikasi kode undangan
  const [isVerified, setIsVerified] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // State untuk form registrasi
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mengecek kode undangan
  const handleCodeCheck = (e) => {
    e.preventDefault();
    
    // Bandingkan kode yang diinput dengan kode dari file .env.local
    if (inviteCode === import.meta.env.VITE_REGISTRATION_CODE) {
      setIsVerified(true);
      setVerificationError(''); // Hapus pesan error jika berhasil
    } else {
      setVerificationError('Kode Undangan salah. Silakan coba lagi.');
    }
  };

  // Fungsi untuk mendaftar setelah kode terverifikasi
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) throw error;
      alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.');
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-sm">
        
        {!isVerified ? (
          // --- TAMPILAN 1: FORM KODE UNDANGAN ---
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Masukkan Kode Undangan</h2>
            <form onSubmit={handleCodeCheck}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="invite-code">Kode Undangan</label>
                <input
                  type="password" // tipe password agar kode tidak terlihat saat diketik
                  id="invite-code"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </div>
              {verificationError && <p className="text-red-500 text-sm mb-4">{verificationError}</p>}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Lanjutkan
              </button>
            </form>
          </div>
        ) : (
          // --- TAMPILAN 2: FORM REGISTRASI (JIKA KODE BENAR) ---
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Daftar Akun Baru</h2>
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">Alamat Email</label>
                <input
                  type="email" id="email"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required disabled={loading}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">Password</label>
                <input
                  type="password" id="password"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required disabled={loading}
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Mendaftarkan...' : 'Daftar'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4">
          <Link to="/" className="text-blue-500 hover:underline">
            Kembali ke Halaman Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default RegisterPage;
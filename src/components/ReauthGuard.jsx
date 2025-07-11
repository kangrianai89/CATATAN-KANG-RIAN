// src/components/ReauthGuard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const VERIFICATION_KEY = 'account_manager_verified_at';
const VERIFICATION_DURATION = 15 * 60 * 1000; // 15 menit dalam milidetik

function ReauthGuard({ session, children }) {
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cek apakah pengguna sudah terverifikasi sebelumnya dalam sesi tab ini
    const lastVerifiedTime = sessionStorage.getItem(VERIFICATION_KEY);
    if (lastVerifiedTime) {
      if (Date.now() - parseInt(lastVerifiedTime, 10) < VERIFICATION_DURATION) {
        setIsVerified(true);
      } else {
        sessionStorage.removeItem(VERIFICATION_KEY);
      }
    }
  }, []);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    // Kita gunakan email pengguna yang sedang login untuk verifikasi
    const userEmail = session.user.email;

    try {
      // Coba login ulang dengan password yang dimasukkan. 
      // Ini hanya untuk verifikasi, tidak akan membuat sesi baru.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      if (reauthError) {
        throw new Error('Password yang Anda masukkan salah.');
      }

      // Jika berhasil, simpan waktu verifikasi dan tampilkan konten
      sessionStorage.setItem(VERIFICATION_KEY, Date.now().toString());
      setIsVerified(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Jika sudah terverifikasi, tampilkan konten halaman (children)
  if (isVerified) {
    return <>{children}</>;
  }

  // Jika belum, tampilkan form permintaan password
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700">
      <h3 className="text-lg font-bold text-center dark:text-white">Verifikasi Keamanan</h3>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
        Untuk mengakses halaman ini, silakan masukkan kembali password Anda.
      </p>
      <form onSubmit={handleVerifyPassword}>
        <div className="space-y-4">
          <div>
            <label htmlFor="reauth-password" className="sr-only">Password</label>
            <input
              id="reauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Memverifikasi...' : 'Buka Akses'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReauthGuard;
// src/pages/MigrationPage.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

function MigrationPage({ session }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [migratedCount, setMigratedCount] = useState(0);

  const handleMigration = async () => {
    if (!session?.user?.id) {
      setMessage('Error: Anda harus login untuk melakukan migrasi.');
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin memulai proses migrasi? Ini akan menyalin catatan dari sistem lama ke sistem baru.")) {
      return;
    }

    setIsLoading(true);
    setMessage('Memulai proses migrasi...');
    setMigratedCount(0);

    try {
      // 1. Ambil semua data dari tabel 'notes' yang lama
      const { data: oldNotes, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id);

      if (fetchError) throw fetchError;

      if (!oldNotes || oldNotes.length === 0) {
        setMessage('Tidak ada data catatan di sistem lama yang perlu dimigrasi.');
        setIsLoading(false);
        return;
      }

      setMessage(`Ditemukan ${oldNotes.length} catatan lama. Mempersiapkan untuk migrasi...`);

      // 2. Ubah format data lama ke format 'workspace_items' yang baru
      const newWorkspaceItems = oldNotes.map(note => ({
        title: note.title,
        content: note.description, // Kolom 'description' lama menjadi 'content'
        user_id: note.user_id,
        type: 'note', // Set tipe sebagai 'note'
        created_at: note.created_at // Jaga tanggal pembuatan asli
      }));

      // 3. Simpan data baru ke tabel 'workspace_items'
      const { error: insertError } = await supabase
        .from('workspace_items')
        .insert(newWorkspaceItems);

      if (insertError) throw insertError;

      setMigratedCount(newWorkspaceItems.length);
      setMessage('SUKSES! Semua catatan lama telah berhasil dimigrasi ke sistem baru.');

    } catch (error) {
      setMessage(`ERROR: Terjadi kesalahan saat migrasi. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold dark:text-white">Utilitas Migrasi Data</h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2 mb-8">
        Gunakan alat ini satu kali untuk memindahkan semua catatan Anda dari struktur database lama ke struktur yang baru.
      </p>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
        <button
          onClick={handleMigration}
          disabled={isLoading}
          className="w-full px-6 py-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-400 transition-all"
        >
          {isLoading ? 'Sedang Bekerja...' : 'Mulai Migrasi Data Lama'}
        </button>
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-left ${message.includes('ERROR') ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'}`}>
            <p className="font-bold">Status:</p>
            <p>{message}</p>
            {migratedCount > 0 && <p>Jumlah item yang dipindahkan: {migratedCount}</p>}
          </div>
        )}
      </div>

      <Link to="/notes" className="inline-block mt-8 text-blue-500 hover:underline">
        &larr; Kembali ke Ruang Kerja
      </Link>
    </div>
  );
}

export default MigrationPage;
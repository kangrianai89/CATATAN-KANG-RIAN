import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

// --- Komponen Ikon ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const WebCollectionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M10 10H17"/><path d="M10 14H17"/></svg>;
const PinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;

function DashboardPage({ session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Ambil Catatan yang Disematkan (Pinned)
        const { data: pinnedData, error: pinnedError } = await supabase
          .from('notes')
          .select('id, title')
          .eq('pinned', true)
          .order('created_at', { ascending: false });

        if (pinnedError) throw pinnedError;
        setPinnedNotes(pinnedData || []);

        // 2. Ambil 5 Catatan Terbaru
        const { data: recentData, error: recentError } = await supabase
          .from('notes')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;
        setRecentNotes(recentData || []);

      } catch (error) {
        alert("Gagal memuat data dashboard: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  // Fungsi untuk membuat catatan baru dan langsung navigasi
  const handleCreateNewNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('notes').insert({ 
        title: 'Catatan Baru Tanpa Judul',
        user_id: user.id, 
        sections: [{ title: 'Bagian Pertama', content: '' }] 
      }).select().single();
      if (error) throw error;
      navigate(`/note/${data.id}/edit`);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Selamat datang kembali, {session.user.email}</p>
      </div>

      {/* 1. Kartu Aksi Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={handleCreateNewNote} className="p-4 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 transition-all flex items-center gap-3">
          <PlusIcon />
          <span className="font-semibold">Buat Catatan Baru</span>
        </button>
        <Link to="/web-collections/new" className="p-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-all flex items-center gap-3">
          <WebCollectionIcon />
          <span className="font-semibold">Tambah Koleksi Web</span>
        </Link>
      </div>

      {/* Kontainer untuk dua daftar (pinned dan recent) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Kartu Catatan Disematkan */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <PinIcon /> Catatan Disematkan
          </h2>
          {loading ? (
            <p className="dark:text-gray-400">Memuat...</p>
          ) : pinnedNotes.length > 0 ? (
            <ul className="space-y-3">
              {pinnedNotes.map(note => (
                <li key={note.id}>
                  <Link to={`/note/${note.id}`} className="block p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-blue-600 dark:text-blue-400 font-medium">
                    {note.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada catatan yang disematkan. Anda bisa menyematkan catatan dari halaman daftar catatan.</p>
          )}
        </div>

        {/* 3. Kartu Aktivitas Terbaru */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <NoteIcon /> Aktivitas Catatan Terbaru
          </h2>
          {loading ? (
            <p className="dark:text-gray-400">Memuat...</p>
          ) : recentNotes.length > 0 ? (
            <ul className="space-y-3">
              {recentNotes.map(note => (
                <li key={note.id} className="flex justify-between items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Link to={`/note/${note.id}`} className="text-blue-600 dark:text-blue-400 font-medium">{note.title}</Link>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Anda belum memiliki catatan apa pun.</p>
          )}
          {recentNotes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link to="/notes" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Lihat semua catatan →
                </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

// --- Komponen Ikon ---
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
const WebCollectionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M10 10H17"/><path d="M10 14H17"/></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>;
const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg>;
// Ikon PinIcon tidak lagi digunakan

function DashboardPage({ session }) {
  const [loading, setLoading] = useState(true);
  const [recentNotes, setRecentNotes] = useState([]);
  const [recentWebCollections, setRecentWebCollections] = useState([]);

  const navigationCards = [
    { title: "Manajemen Catatan", desc: "Tulis, atur, dan cari semua catatan Anda.", icon: <NoteIcon />, path: "/notes", color: "purple" },
    { title: "Koleksi Web", desc: "Simpan dan kelola koleksi link berharga.", icon: <WebCollectionIcon />, path: "/web-collections", color: "blue" },
    { title: "Manajer Email", desc: "Kelola daftar akun email dengan mudah.", icon: <EmailIcon />, path: "/email-manager", color: "red" },
    { title: "Ekstraktor Teks", desc: "Ambil teks dari gambar secara instan.", icon: <ScanIcon />, path: "/image-reader", color: "green" }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // PERUBAHAN: Hanya mengambil data yang relevan
        const [recentNotesResponse, webCollectionsResponse] = await Promise.all([
          // Mengambil 3 catatan terbaru
          supabase.from('workspace_items').select('id, title, created_at').eq('type', 'note').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(3),
          // Mengambil 3 koleksi web terbaru
          supabase.from('workspace_items').select('id, title').eq('type', 'web_collection').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(3)
        ]);

        if (recentNotesResponse.error) throw recentNotesResponse.error;
        if (webCollectionsResponse.error) throw webCollectionsResponse.error;

        setRecentNotes(recentNotesResponse.data || []);
        setRecentWebCollections(webCollectionsResponse.data || []);

      } catch (error) {
        alert("Gagal memuat data dashboard: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
            <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Selamat datang kembali, {session.user.email}</p>
        </div>
        {/* Tombol Logout dipindahkan ke Sidebar */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {navigationCards.map(card => (
          <Link to={card.path} key={card.title} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300">
            <div className={`text-${card.color}-500 dark:text-${card.color}-400 mb-3`}>
              {React.cloneElement(card.icon, { width: 28, height: 28 })}
            </div>
            <h3 className="font-bold text-lg dark:text-white mb-1">{card.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700"></div>
      
      {/* PERUBAHAN: Menghapus grid dan bagian "Catatan Disematkan" */}
      <div className="space-y-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><NoteIcon /> Aktivitas Catatan Terbaru</h2>
            {loading ? <p className="dark:text-gray-400">Memuat...</p> : recentNotes.length > 0 ? (
              <ul className="space-y-2">
                {recentNotes.map((note, index) => (
                  <li key={note.id} className={`flex justify-between items-center py-3 ${index < recentNotes.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                    <Link to={`/note/${note.id}`} className="text-blue-600 dark:text-blue-400 font-medium truncate pr-4 hover:underline">{note.title}</Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{new Date(note.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 dark:text-gray-400 text-sm">Anda belum memiliki catatan apa pun.</p>}
            {recentNotes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link to="/notes" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline text-sm">Lihat semua catatan →</Link>
              </div>
            )}
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><WebCollectionIcon /> Koleksi Web Terbaru</h2>
              {loading ? <p className="dark:text-gray-400">Memuat...</p> : recentWebCollections.length > 0 ? (
                  <ul className="space-y-2">
                      {recentWebCollections.map((collection, index) => (
                          <li key={collection.id} className={`flex justify-between items-center py-3 ${index < recentWebCollections.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                              <Link to={`/web-collection/${collection.id}`} className="text-green-600 dark:text-green-400 font-medium truncate pr-4 hover:underline">{collection.title}</Link>
                          </li>
                      ))}
                  </ul>
              ) : <p className="text-gray-500 dark:text-gray-400 text-sm">Anda belum memiliki koleksi web.</p>}
               {recentWebCollections.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link to="/web-collections" className="text-green-600 dark:text-green-400 font-semibold hover:underline text-sm">Lihat semua koleksi →</Link>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}

export default DashboardPage;

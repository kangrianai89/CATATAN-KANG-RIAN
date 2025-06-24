// File: src/App.jsx
// Status: Ditambahkan rute baru untuk Koleksi Web

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Perhatikan: 'react-router-dom' tanpa '--'
import { supabase } from './supabaseClient';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NoteDetailPage from "./pages/NoteDetailPage";
import PlaygroundPage from './pages/PlaygroundPage';
import AssetDetailPage from './pages/AssetDetailPage';
import GeneratorListPage from './pages/GeneratorListPage';
import BlueprintGenerator from './generators/BlueprintGenerator';
import MainLayout from './components/MainLayout';
import SettingsPage from './pages/SettingsPage';
import EmailManagerPage from './pages/EmailManagerPage';
import ImageReaderPage from './pages/ImageReaderPage';

// --- IMPOR HALAMAN BARU UNTUK KOLEKSI WEB ---
import WebCollectionPage from './pages/WebCollectionPage'; // <-- Impor halaman daftar
import WebLinkDetailPage from './pages/WebLinkDetailPage'; // <-- Impor halaman detail/edit

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  const ProtectedLayout = () => {
    if (!session) {
      return <Navigate to="/" />;
    }
    return <MainLayout />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rute publik */}
        <Route path="/" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />} />

        {/* Grup rute yang dilindungi */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage session={session} />} />
          <Route path="/note/:id" element={<NoteDetailPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/asset/:id" element={<AssetDetailPage />} />
          <Route path="/generators" element={<GeneratorListPage />} />
          <Route path="/generator/blueprint" element={<BlueprintGenerator />} />
          <Route path="/email-manager" element={<EmailManagerPage />} />
          <Route path="/image-reader" element={<ImageReaderPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* --- DAFTARKAN RUTE BARU UNTUK KOLEKSI WEB --- */}
          <Route path="/web-collection" element={<WebCollectionPage />} /> {/* Halaman daftar */}
          <Route path="/web-link/:id" element={<WebLinkDetailPage />} />   {/* Halaman detail/edit/tambah */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

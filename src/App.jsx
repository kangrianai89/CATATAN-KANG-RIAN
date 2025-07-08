import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from './supabaseClient';

// Import Halaman
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NotesPage from "./pages/NotesPage";
import NoteViewPage from './pages/NoteViewPage';
import PlaygroundPage from './pages/PlaygroundPage';
import AssetDetailPage from './pages/AssetDetailPage';
import GeneratorListPage from './pages/GeneratorListPage';
import BlueprintGenerator from './generators/BlueprintGenerator';
import EmailManagerPage from './pages/EmailManagerPage';
import ImageReaderPage from './pages/ImageReaderPage';
import SettingsPage from './pages/SettingsPage';
import WebCollectionsPage from './pages/WebCollectionsPage'; 
import WebCollectionDetailPage from './pages/WebCollectionDetailPage';
import NoteCollectionDetailPage from './pages/NoteCollectionDetailPage';
import ChatPage from './pages/ChatPage';

// Import Layout
import MainLayout from './components/MainLayout';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Komponen ProtectedLayout yang stabil, berada di luar App
const ProtectedLayout = ({ session }) => {
  if (!session) {
    return <Navigate to="/" />;
  }
  // MainLayout akan merender halaman yang sesuai melalui <Outlet />
  return <MainLayout session={session} />;
};


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

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Memuat Sesi...</div>;

  return (
    <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Rute Publik */}
            <Route path="/" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />} />
            
            {/* Rute Terlindungi yang menggunakan ProtectedLayout */}
            <Route element={<ProtectedLayout session={session} />}>
              {/* --- PERBAIKAN: Semua rute di bawah ini sekarang menerima 'session' sebagai prop --- */}
              <Route path="/dashboard" element={<DashboardPage session={session} />} />
              
              {/* Rute untuk Catatan */}
              <Route path="/notes" element={<NotesPage session={session} />} />
              <Route path="/note/:id" element={<NoteViewPage session={session} />} />
              <Route path="/note-collection/:id" element={<NoteCollectionDetailPage session={session} />} />

              {/* Rute Lainnya */}
              <Route path="/playground" element={<PlaygroundPage session={session} />} />
              <Route path="/asset/:id" element={<AssetDetailPage session={session} />} />
              <Route path="/generators" element={<GeneratorListPage session={session} />} />
              <Route path="/generator/blueprint" element={<BlueprintGenerator session={session} />} />
              <Route path="/email-manager" element={<EmailManagerPage session={session} />} />
              <Route path="/image-reader" element={<ImageReaderPage session={session} />} />
              <Route path="/settings" element={<SettingsPage session={session} />} />
              
              <Route path="/web-collections" element={<WebCollectionsPage session={session} />} />
              <Route path="/web-collections/:id" element={<WebCollectionDetailPage session={session} />} />

              {/* Rute untuk Chat AI */}
              <Route path="/chat" element={<ChatPage session={session} />} />
            </Route>
          </Routes>
        </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

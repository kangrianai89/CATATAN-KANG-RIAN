import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from './supabaseClient';

// Import Halaman
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NotesPage from "./pages/NotesPage";
// import NoteDetailPage from "./pages/NoteDetailPage"; // <-- DIHAPUS
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
import NoteCollectionDetailPage from './pages/NoteCollectionDetailPage'; // <-- DITAMBAHKAN

// Import Layout
import MainLayout from './components/MainLayout';
import { ThemeProvider } from './context/ThemeContext.jsx';


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

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const ProtectedLayout = ({ children, session }) => {
    if (!session) {
      return <Navigate to="/" />;
    }
    return <MainLayout session={session}>{children}</MainLayout>;
  };

  return (
    <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Rute Publik */}
            <Route path="/" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />} />
            
            {/* Rute Terlindungi */}
            <Route element={<ProtectedLayout session={session} />}>
              <Route path="/dashboard" element={<DashboardPage session={session} />} />
              
              {/* Rute untuk Catatan (Diperbarui) */}
              <Route path="/notes" element={<NotesPage session={session} />} />
              {/* <Route path="/notes/category/:categoryId" element={<NotesPage session={session} />} /> */} {/* <-- DIHAPUS (untuk sementara) */}
              <Route path="/note/:id" element={<NoteViewPage />} />
              {/* <Route path="/note/:id/edit" element={<NoteDetailPage />} /> */} {/* <-- DIHAPUS */}
              <Route path="/note-collection/:id" element={<NoteCollectionDetailPage session={session} />} /> {/* <-- DITAMBAHKAN */}

              {/* Rute Lainnya */}
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/asset/:id" element={<AssetDetailPage />} />
              <Route path="/generators" element={<GeneratorListPage />} />
              <Route path="/generator/blueprint" element={<BlueprintGenerator />} />
              <Route path="/email-manager" element={<EmailManagerPage />} />
              <Route path="/image-reader" element={<ImageReaderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              <Route path="/web-collections" element={<WebCollectionsPage session={session} />} />
              <Route path="/web-collections/:id" element={<WebCollectionDetailPage session={session} />} />
            </Route>
          </Routes>
        </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
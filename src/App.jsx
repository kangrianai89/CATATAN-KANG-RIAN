import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import EmailManagerPage from './pages/EmailManagerPage';
import ImageReaderPage from './pages/ImageReaderPage';
import SettingsPage from './pages/SettingsPage';
import NoteViewPage from './pages/NoteViewPage';
import WebCollectionsPage from './pages/WebCollectionsPage'; 
// --- Mengubah import komponen detail Koleksi Web ---
import WebCollectionDetailPage from './pages/WebCollectionDetailPage';


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

  // ProtectedLayout sekarang menerima children dan session
  const ProtectedLayout = ({ children, session }) => {
    if (!session) {
      return <Navigate to="/" />;
    }
    // MainLayout akan menerima children dan session
    return <MainLayout session={session}>{children}</MainLayout>;
  };

  return (
    <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />} />
            {/* Teruskan session ke ProtectedLayout sebagai prop */}
            <Route element={<ProtectedLayout session={session} />}>
              <Route path="/dashboard" element={<DashboardPage session={session} />} />
              
              <Route path="/note/:id" element={<NoteViewPage />} />
              <Route path="/note/:id/edit" element={<NoteDetailPage />} />

              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/asset/:id" element={<AssetDetailPage />} />
              <Route path="/generators" element={<GeneratorListPage />} />
              <Route path="/generator/blueprint" element={<BlueprintGenerator />} />
              <Route path="/email-manager" element={<EmailManagerPage />} />
              <Route path="/image-reader" element={<ImageReaderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              {/* Teruskan session ke WebCollectionsPage */}
              <Route path="/web-collections" element={<WebCollectionsPage session={session} />} />
              {/* --- Rute untuk Detail Koleksi Web (menggunakan komponen yang sudah diganti nama) --- */}
              <Route path="/web-collections/:id" element={<WebCollectionDetailPage session={session} />} />

            </Route>
          </Routes>
        </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
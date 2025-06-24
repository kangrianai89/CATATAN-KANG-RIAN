import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from './supabaseClient';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NoteViewPage from './pages/NoteViewPage';
import NoteDetailPage from "./pages/NoteDetailPage";
import PlaygroundPage from './pages/PlaygroundPage';
import AssetDetailPage from './pages/AssetDetailPage';
import GeneratorListPage from './pages/GeneratorListPage';
import BlueprintGenerator from './generators/BlueprintGenerator';
import MainLayout from './components/MainLayout';
import EmailManagerPage from './pages/EmailManagerPage';
import ImageReaderPage from './pages/ImageReaderPage';
import SettingsPage from './pages/SettingsPage';
import WebCollectionPage from './pages/WebCollectionPage';
import WebLinkDetailPage from './pages/WebLinkDetailPage';

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
        <Route path="/" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage session={session} />} />
          <Route path="/note/:id" element={<NoteViewPage />} />
          <Route path="/note/edit/:id" element={<NoteDetailPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/asset/:id" element={<AssetDetailPage />} />
          <Route path="/asset/new" element={<AssetDetailPage />} />
          <Route path="/generators" element={<GeneratorListPage />} />
          <Route path="/generator/blueprint" element={<BlueprintGenerator />} />
          <Route path="/email-manager" element={<EmailManagerPage />} />
          <Route path="/image-reader" element={<ImageReaderPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/web-collection" element={<WebCollectionPage />} />
          <Route path="/weblink/new" element={<WebLinkDetailPage />} />
          <Route path="/weblink/edit/:id" element={<WebLinkDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
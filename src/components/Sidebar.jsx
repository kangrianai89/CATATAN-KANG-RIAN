import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// --- KOMPONEN IKON ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
const AssetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const GeneratorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>;
const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const InstallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>;
const WebCollectionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M10 10H17"/><path d="M10 14H17"/></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>; // DITAMBAHKAN

function Sidebar({ isOpen, setSidebarOpen }) {
  const { theme, toggleTheme } = useTheme();
  const [installPrompt, setInstallPrompt] = useState(null);

  const linkClass = "flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 transition-colors";
  const activeLinkClass = "bg-gray-600 font-semibold";

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleLinkClick = () => {
    if (window.innerWidth < 768) { 
        setSidebarOpen(false);
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    console.log('Install prompt result:', result);
    setInstallPrompt(null);
    setSidebarOpen(false);
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white p-4 flex flex-col transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
      <h2 className="text-2xl font-bold mb-8">CATATAN KANG RIAN</h2>
      <nav className="flex-1">
        <ul className="space-y-1">
          <li><NavLink to="/dashboard" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`} end><DashboardIcon /><span>Dashboard</span></NavLink></li>
          <li className="pt-2"><div className="border-t border-gray-700"></div></li>
          
          <li><NavLink to="/notes" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><NoteIcon /><span>Catatan</span></NavLink></li>
          <li><NavLink to="/web-collections" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><WebCollectionIcon /><span>Koleksi Web</span></NavLink></li>
          
          {/* Link Chat AI DITAMBAHKAN DI SINI */}
          <li><NavLink to="/chat" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><ChatIcon /><span>Asisten AI</span></NavLink></li>
          
          <li className="pt-2"><div className="border-t border-gray-700"></div></li>

          <li><NavLink to="/playground" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><AssetIcon /><span>Koleksi Aset</span></NavLink></li>
          <li><NavLink to="/generators" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><GeneratorIcon /><span>Koleksi Generator</span></NavLink></li>
          <li><NavLink to="/email-manager" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><EmailIcon /><span>Manajer Email</span></NavLink></li>
          <li><NavLink to="/image-reader" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><ScanIcon /><span>Ekstraktor Teks</span></NavLink></li>
        </ul>
      </nav>
      
      <div className="mt-4 space-y-2">
        {installPrompt && (
          <button onClick={handleInstallClick} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-500 hover:bg-green-600">
            <InstallIcon />
            <span>Install Aplikasi</span>
          </button>
        )}
        <NavLink to="/settings" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>
            <SettingsIcon />
            <span>Pengaturan Akun</span>
        </NavLink>
        <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
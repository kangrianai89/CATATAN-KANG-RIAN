// File: src/components/MainLayout.jsx
// Status: Perbaikan tampilan responsif untuk mobile
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

// Ikon untuk tombol menu hamburger
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen md:flex bg-gray-100 dark:bg-gray-900">
      
      {/* Tombol Hamburger untuk Mobile */}
      <div className="bg-gray-800 text-white flex justify-between md:hidden">
        <a href="/dashboard" className="block p-4 text-white font-bold">DevStudy Hub</a>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-4 focus:outline-none focus:bg-gray-700">
          <MenuIcon />
        </button>
      </div>

      {/* Sidebar */}
      {/* Sidebar akan ditampilkan atau disembunyikan berdasarkan state dan ukuran layar */}
      <Sidebar isOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Overlay untuk Mobile saat sidebar terbuka */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
        ></div>
      )}

      {/* Konten Utama */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 md:ml-64"> {/* <-- PERBAIKAN PENTING DI SINI */}
        <Outlet />
      </main>
      
    </div>
  );
}

export default MainLayout;

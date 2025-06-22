import React from 'react';
import Sidebar from './Sidebar';
// Perbaiki baris ini
import { Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    // Tambahkan warna latar untuk mode terang dan gelap
    <div className="flex bg-white dark:bg-gray-900"> 
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
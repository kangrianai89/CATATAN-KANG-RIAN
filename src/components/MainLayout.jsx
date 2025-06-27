import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

function MainLayout({ session }) { 
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen md:flex bg-gray-100 dark:bg-gray-900">
      
      {/* --- HEADER MOBILE DIPERBARUI --- */}
      <div className="bg-gray-800 text-white flex justify-between md:hidden">
        <a href="/dashboard" className="block p-4 text-white font-bold">CATATAN KANG RIAN</a>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-4 focus:outline-none focus:bg-gray-700">
          <MenuIcon />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        {React.cloneElement(<Outlet />, { session: session })}
      </main>
      
    </div>
  );
}

export default MainLayout;
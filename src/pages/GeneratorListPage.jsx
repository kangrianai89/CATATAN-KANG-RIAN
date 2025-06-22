import React from 'react';
import { Link } from 'react-router-dom';

function GeneratorListPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Koleksi Generator</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200">
                      Generator Bawaan
                 </span>
              </div>
              <h3 className="font-bold text-lg dark:text-white truncate mt-1">Blueprint Generator</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Membuat blueprint & prompt dari ide.</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Link 
                to={`/generator/blueprint`} 
                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-200 text-sm rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-600 font-semibold"
              >
                Buka
              </Link>
            </div>
          </div>
        </div>
        {/* Generator bawaan lainnya bisa ditambahkan di sini nanti */}
      </div>
    </>
  );
}

export default GeneratorListPage;
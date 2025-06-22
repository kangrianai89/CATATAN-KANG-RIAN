import React, { useState } from 'react';

// --- Komponen & Fungsi Helper ---

const downloadFile = (filename, content, mimeType) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: mimeType });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const GenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.1-6.84-9.54"/></svg>
);
const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M10 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/><polyline points="15 12 20 7 15 2"/><line x1="20" y1="7" x2="8" y2="7"/></svg>
);
const CopyIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const PromptModal = ({ prompts, onClose }) => {
    // ... (Isi komponen modal sama seperti yang Anda berikan)
    return <div>Modal Content</div>; // Placeholder sederhana
};


// --- Komponen Utama Generator ---

export default function BlueprintGenerator() {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executiveBlueprint, setExecutiveBlueprint] = useState('');
  const [canvasPrompts, setCanvasPrompts] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  
  const handleGenerateBlueprint = async () => {
    if (!projectName || !projectDescription) {
      alert("Mohon isi Nama Proyek dan Deskripsi terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    setExecutiveBlueprint('Membuat blueprint... (Fungsi API belum terhubung)');
    // Logika untuk memanggil API Gemini akan kita implementasikan di sini nanti
    // Untuk saat ini, kita simulasikan saja hasilnya
    setTimeout(() => {
        const bp = { judul: `Blueprint untuk ${projectName}`, visi: `Visi untuk ${projectDescription}`, alur: 'Alur...', konsep: 'Konsep...', proses: 'Proses...', ringkasan: 'Ringkasan...' };
        const formattedBlueprint = `# ${bp.judul}\n\n## Visi & Tujuan Utama\n${bp.visi}\n\n## Alur Kerja Aplikasi\n${bp.alur}`;
        setExecutiveBlueprint(formattedBlueprint);
        setIsLoading(false);
    }, 2000);
  };

  const handleCopy = (text) => { /* ... (Fungsi copy sama seperti yang Anda berikan) ... */ };
  const isInputFilled = projectName && projectDescription;

  return (
    <div className="w-full">
        <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-1 text-slate-900 dark:text-white">Langkah 1: Definisikan Ide Anda</h2>
                <p className="text-slate-600 dark:text-gray-400 mb-4 text-sm">Jelaskan ide Anda, dan biarkan tim ahli AI menyusun blueprint dan prompt teknis untuk Anda.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nama Proyek</label>
                        <input type="text" id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Contoh: Platform Chat AI Multi-Ahli" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="project-desc" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Deskripsi Singkat</label>
                        <textarea id="project-desc" rows="4" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Jelaskan tujuan utama, masalah yang dipecahkan, dan target pengguna aplikasi Anda." className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
            </div>
            
            <div className="text-center mb-8">
                <button onClick={handleGenerateBlueprint} disabled={!isInputFilled || isLoading} className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-all">
                    {isLoading ? <Spinner /> : <GenerateIcon />}
                    {isLoading ? 'Sedang Membuat Blueprint...' : 'Buat Blueprint & Prompts'}
                </button>
            </div>

            {executiveBlueprint && !isLoading && (
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:bg-gray-800 dark:border-gray-700">
                  <textarea value={executiveBlueprint} readOnly className="w-full h-[400px] p-4 bg-slate-100 rounded-md border border-slate-300 font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            )}
        </div>
    </div>
  );
}
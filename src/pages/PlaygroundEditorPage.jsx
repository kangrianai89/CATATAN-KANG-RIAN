import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

function PlaygroundEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState('split');
    const [activeTab, setActiveTab] = useState('editor');
    const { theme } = useTheme();
    const debouncedCode = useDebounce(code, 800);

    // --- Efek untuk menerjemahkan kode React ---
    useEffect(() => {
        if (debouncedCode) {
            try {
                if (!window.Babel) { throw new Error("Babel.js is not loaded."); }
                const transformedCode = window.Babel.transform(debouncedCode, { presets: ['react'] }).code;
                const fullHtml = `
                    <html><head><script src="https://cdn.tailwindcss.com"></script></head>
                    <body><div id="root"></div><script type="text/javascript">
                    try { ${transformedCode} } catch (err) { 
                        document.getElementById('root').innerHTML = '<div style="color:red;padding:1rem;"><h2>Runtime Error:</h2><pre>' + err + '</pre></div>';
                    }
                    </script></body></html>`;
                setIframeContent(fullHtml);
            } catch (err) {
                const errorHtml = `
                    <html><body><div style="color:red;padding:1rem;">
                    <h2>Compilation Error:</h2><pre>${err.message}</pre>
                    </div></body></html>`;
                setIframeContent(errorHtml);
            }
        } else {
            setIframeContent('');
        }
    }, [debouncedCode]);
    // (Fungsi dan state lain yang tidak relevan dengan perubahan ini akan disingkat)
    const [iframeContent, setIframeContent] = useState('');


    const fetchPage = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('pages').select('title, code, category_id').eq('id', id).single();
            if (error) throw error;
            setTitle(data.title || '');
            setCode(data.code || '');
        } catch (error) {
            alert('Gagal memuat halaman: ' + error.message);
            navigate('/playground');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { fetchPage(); }, [fetchPage]);
    
    const handleUpdatePage = async () => { /* ... (Tidak ada perubahan di sini) ... */ };

    // --- FUNGSI BARU UNTUK MENGAMBIL API KEY ---
    const getApiKey = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Pengguna tidak ditemukan.");

        const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single();
        
        if (profile && profile.gemini_api_key) {
            return profile.gemini_api_key;
        }
        
        const mainApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (mainApiKey) {
            return mainApiKey;
        }

        throw new Error("API Key belum diatur. Silakan atur di halaman Pengaturan Akun atau konfigurasikan kunci utama aplikasi.");
    };

    // --- FUNGSI GENERATE KODE DIPERBARUI ---
    async function handleGenerateCode(e) {
        e.preventDefault();
        if (!aiPrompt.trim()) return alert('Tuliskan permintaan Anda untuk AI.');
        
        setIsGenerating(true);
        try {
            const apiKey = await getApiKey(); // Ambil kunci yang sesuai
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

            const fullPrompt = `Anda adalah seorang ahli developer web. Berdasarkan permintaan berikut, buatkan satu blok kode React JSX fungsional. JANGAN berikan penjelasan apapun, JANGAN gunakan markdown. Berikan hanya kode mentahnya saja. Pastikan kode bisa langsung dijalankan.\n\nPermintaan: "${aiPrompt}"`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API request failed: ${errorBody.error.message}`);
            }

            const data = await response.json();
            const generatedCode = data.candidates[0].content.parts[0].text;
            
            // Tambahkan hasil ke kode yang sudah ada
            setCode(prevCode => prevCode + '\n\n' + generatedCode);
            setAiPrompt(''); 

        } catch (error) {
            alert('Gagal menghasilkan kode: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    }
    
    if (loading) return <div className="p-8 dark:text-gray-300">Memuat editor...</div>;

    const editorPanel = (
        <div className="flex flex-col h-full">
            <label className="mb-2 font-semibold text-gray-700 dark:text-white">Editor Kode (React JSX)</label>
            <div className="w-full h-full border rounded-lg overflow-hidden dark:border-gray-700">
                <Editor
                    height="100%"
                    language="javascript"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
                />
            </div>
        </div>
    );

    const previewPanel = (
        <div className="flex flex-col h-full">
            <label className="mb-2 font-semibold text-gray-700 dark:text-white">Live Preview</label>
            <iframe
                srcDoc={iframeContent}
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border rounded-lg bg-white dark:border-gray-700"
            />
        </div>
    );

    return (
        <>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              {/* ... (UI Header tidak berubah) ... */}
            </div>

            {/* ... (UI Kategori tidak berubah) ... */}

            <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <form onSubmit={handleGenerateCode}>
                    <label htmlFor="ai-prompt" className="block text-lg font-semibold mb-2 text-gray-800 dark:text-white">Bantuan AI Gemini ✨</label>
                    <div className="flex gap-2">
                        <input id="ai-prompt" type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Contoh: buatkan 3 tombol dengan warna berbeda..." className="flex-grow w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600" disabled={isGenerating}/>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400" disabled={isGenerating}>
                            {isGenerating ? 'Membuat...' : 'Buatkan Kode'}
                        </button>
                    </div>
                </form>
            </div>

            <div style={{ height: '65vh' }}>
                {/* ... (UI Split/Tab tidak berubah) ... */}
            </div>
        </>
    );
}

export default PlaygroundEditorPage;
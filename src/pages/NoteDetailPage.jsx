import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Komponen Menu Bar (Tidak ada perubahan)
const MenuBar = ({ editor }) => {
  if (!editor) return null;
  const buttonClass = "px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white";
  return (
    <div className="p-2 border-x border-t dark:border-gray-600 rounded-t-lg bg-gray-100 dark:bg-gray-900/50 flex flex-wrap gap-2 tiptap">
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}>H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={`${buttonClass} ${editor.isActive('paragraph') ? 'is-active' : ''}`}>Paragraf</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${buttonClass} ${editor.isActive('bold') ? 'is-active' : ''}`}>Bold</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${buttonClass} ${editor.isActive('italic') ? 'is-active' : ''}`}>Italic</button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${buttonClass} ${editor.isActive('strike') ? 'is-active' : ''}`}>Strike</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${buttonClass} ${editor.isActive('bulletList') ? 'is-active' : ''}`}>List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${buttonClass} ${editor.isActive('orderedList') ? 'is-active' : ''}`}>List Angka</button>
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${buttonClass} ${editor.isActive('codeBlock') ? 'is-active' : ''}`}>Code Block</button>
    </div>
  );
};

// Komponen Editor Section (Tidak ada perubahan)
const EditorSection = ({ section, onTitleChange, onContentChange, onRemove }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: section.content || '',
    onUpdate: ({ editor }) => { onContentChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 border dark:border-gray-600 rounded-b-lg min-h-[150px] bg-white dark:bg-gray-700 focus:outline-none',
      },
    },
  }, [section.content]);

  if (!editor) { return <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"><p className="dark:text-gray-400">Memuat editor...</p></div>; }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <input type="text" placeholder="Judul Bagian..." value={section.title} onChange={(e) => onTitleChange(e.target.value)} className="text-lg font-semibold bg-transparent w-full focus:outline-none dark:text-white px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md" />
        {onRemove && (<button type="button" onClick={onRemove} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0 ml-2">Hapus Bagian</button>)}
      </div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

// --- KOMPONEN MODAL BARU UNTUK ANALISIS ---
const AnalysisModal = ({ result, onApply, onClose }) => {
    if (!result) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Hasil Proses AI</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Konten Asli</h4>
                        <div className="prose dark:prose-invert max-w-none p-3 h-96 overflow-y-auto border rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-600" dangerouslySetInnerHTML={{ __html: result.originalHtml }} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Saran Perbaikan & Ringkasan AI</h4>
                        <div className="prose dark:prose-invert max-w-none p-3 h-96 overflow-y-auto border rounded-md bg-green-50 dark:bg-green-900/30 dark:border-green-700" dangerouslySetInnerHTML={{ __html: result.konten_rapi + result.ringkasan_poin }} />
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Batal</button>
                    <button onClick={onApply} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">Terapkan Perubahan</button>
                </div>
            </div>
        </div>
    );
};

function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);

  // --- State untuk Modal dan Hasil AI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchNote = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('notes').select('title, sections').eq('id', id).single();
      if (error) throw error;
      setTitle(data.title || '');
      if (data.sections && data.sections.length > 0) {
        setSections(data.sections.map(sec => ({...sec, id: crypto.randomUUID()})));
      } else {
        setSections([{ id: crypto.randomUUID(), title: 'Bagian Pertama', content: '' }]);
      }
    } catch (error) {
      alert("Gagal memuat catatan: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNote();
  }, [id, fetchNote]);

  const handleUpdateSection = useCallback((index, field, value) => {
    setSections(prevSections => {
      const newSections = [...prevSections];
      newSections[index][field] = value;
      return newSections;
    });
  }, []);

  const addSection = useCallback(() => {
    setSections(prevSections => [...prevSections, { id: crypto.randomUUID(), title: 'Bagian Baru', content: '' }]);
  }, []);

  const removeSection = useCallback((index) => {
    if (sections.length <= 1) {
      alert("Setidaknya harus ada satu bagian.");
      return;
    }
    if (window.confirm("Yakin ingin menghapus bagian ini?")) {
      setSections(prevSections => prevSections.filter((_, i) => i !== index));
    }
  }, [sections.length]);

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    try {
        const sectionsToSave = sections.map(({ id, ...rest }) => rest);
        const { error } = await supabase.from('notes').update({
            title: title,
            sections: sectionsToSave
        }).eq('id', id);
        if (error) throw error;
        alert('Catatan berhasil diperbarui!');
    } catch (error) {
        alert(error.message);
    }
  };

  const getApiKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");
    const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single();
    if (profile && profile.gemini_api_key) return profile.gemini_api_key;
    const mainApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (mainApiKey) return mainApiKey;
    throw new Error("API Key Gemini belum diatur.");
  };

  const handleSmartProcess = async () => {
    const originalHtml = sections.map(sec => `<h2>${sec.title}</h2>${sec.content}`).join('');
    if (!originalHtml.trim()) return alert("Tidak ada konten untuk diproses.");

    setIsProcessing(true);
    setProcessingResult(null);

    const smartPrompt = `
    Anda adalah seorang analis konten dan editor ahli... (prompt sama seperti sebelumnya)
    `;

    try {
      const apiKey = await getApiKey();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: smartPrompt }] }] })
      });
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API request failed: ${errorBody.error.message}`);
      }
      const data = await response.json();
      let rawJsonText = data.candidates[0].content.parts[0].text;
      if (rawJsonText.startsWith('```json')) {
        rawJsonText = rawJsonText.substring(7, rawJsonText.lastIndexOf('```')).trim();
      }
      const result = JSON.parse(rawJsonText);

      // Simpan hasil ke state dan buka modal
      setProcessingResult({
        ...result,
        originalHtml: originalHtml
      });
      setIsModalOpen(true);

    } catch (error) {
      console.error("Error memproses catatan:", error);
      alert("Gagal memproses catatan: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // --- FUNGSI BARU UNTUK MENERAPKAN PERUBAHAN ---
  const handleApplyChanges = async () => {
    if (!processingResult) return;
    
    const newSections = [
        { title: 'Konten yang Diproses AI', content: processingResult.konten_rapi },
        { title: 'Ringkasan Poin Penting', content: processingResult.ringkasan_poin }
    ];

    try {
        const sectionsToSave = newSections.map(({ id, ...rest }) => rest);
        const { error } = await supabase.from('notes').update({ sections: sectionsToSave }).eq('id', id);
        if (error) throw error;

        // Perbarui state lokal hanya setelah berhasil menyimpan ke DB
        setSections(newSections.map(sec => ({...sec, id: crypto.randomUUID()})));
        alert('Perubahan dari AI berhasil diterapkan dan disimpan!');
    } catch (error) {
        alert("Gagal menyimpan perubahan AI: " + error.message);
    } finally {
        setIsModalOpen(false);
        setProcessingResult(null);
    }
  };

  const handleCopyNote = () => {
    const convertHtmlToText = (html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    };
    let fullNoteText = `# ${title}\n\n`;
    sections.forEach(sec => {
        fullNoteText += `## ${sec.title}\n`;
        fullNoteText += `${convertHtmlToText(sec.content)}\n\n`;
    });
    navigator.clipboard.writeText(fullNoteText.trim()).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }, (err) => {
        alert('Gagal menyalin catatan: ' + err);
    });
  };

  if (loading) return <div className="p-8 dark:text-gray-300">Memuat catatan...</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Catatan</h1>
        <Link to="/dashboard" className="text-blue-500 hover:underline">&larr; Kembali ke Dashboard</Link>
      </div>
      <form onSubmit={handleUpdateNote}>
        <div className="mb-6">
          <label htmlFor="main-title" className="block text-xl font-semibold mb-2 text-gray-900 dark:text-white">Judul Utama Catatan</label>
          <input id="main-title" type="text" className="w-full text-2xl font-bold px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={title} onChange={(e) => setTitle(e.target.value)} required/>
        </div>
        <div className="space-y-6">
          {sections.map((section, index) => (
            <EditorSection
              key={section.id}
              section={section}
              onTitleChange={(newTitle) => handleUpdateSection(index, 'title', newTitle)}
              onContentChange={(newContent) => handleUpdateSection(index, 'content', newContent)}
              onRemove={sections.length > 1 ? () => removeSection(index) : null}
            />
          ))}
        </div>
        <div className="mt-6 pt-6 border-t dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={addSection} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
            + Tambah Bagian
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleSmartProcess} disabled={isProcessing} className="px-6 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 disabled:bg-gray-400">
                {isProcessing ? 'Memproses...' : 'Proses & Rangkum AI ✨'}
            </button>
            <button type="button" onClick={handleCopyNote} className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600">
                {copySuccess ? 'Berhasil Disalin!' : 'Salin Catatan'}
            </button>
            <button type="submit" className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">
                Simpan Seluruh Catatan
            </button>
          </div>
        </div>
      </form>
      
      {/* Panggil Modal di sini */}
      <AnalysisModal 
        result={processingResult}
        onApply={handleApplyChanges}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
export default NoteDetailPage;
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Komponen Menu Bar untuk editor Tiptap
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

// Komponen terpisah untuk setiap bagian editor
const EditorSection = ({ section, onTitleChange, onContentChange, onRemove }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: section.content || '',
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 border dark:border-gray-600 rounded-b-lg min-h-[150px] bg-white dark:bg-gray-700 focus:outline-none',
      },
    },
  }, [section.id, section.content]);

  if (!editor) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
        <p className="dark:text-gray-400">Memuat editor...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="Judul Bagian..."
          value={section.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-semibold bg-transparent w-full focus:outline-none dark:text-white px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
        />
        {onRemove && (
            <button type="button" onClick={onRemove} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0 ml-2">Hapus Bagian</button>
        )}
      </div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false); // State baru untuk menggantikan isTidying & isSummarizing
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
    setSections(prevSections => {
      if (prevSections.length <= 1) {
        alert("Setidaknya harus ada satu bagian.");
        return prevSections;
      }
      if (window.confirm("Yakin ingin menghapus bagian ini?")) {
        return prevSections.filter((_, i) => i !== index);
      }
      return prevSections;
    });
  }, []);

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Pengguna tidak terautentikasi.");
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileError);
      throw new Error("Gagal memuat API Key dari profil: " + profileError.message);
    }

    if (profile && profile.gemini_api_key) return profile.gemini_api_key;

    const mainApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (mainApiKey) return mainApiKey;

    throw new Error("API Key Gemini belum diatur di Pengaturan Akun atau di variabel lingkungan.");
  };

  // --- FUNGSI BARU GABUNGAN ---
  const handleSmartProcess = async () => {
    const combinedHtml = sections.map(sec => `<h2>${sec.title}</h2>${sec.content}`).join('');
    if (!combinedHtml.trim()) return alert("Tidak ada konten untuk diproses.");

    setIsProcessing(true);
    
    const smartPrompt = `
    Anda adalah asisten editor yang sangat cerdas. Diberikan konten HTML, lakukan dua tugas berikut:
    1.  **Tidy Up (Merapikan):** Analisis dan rapikan seluruh konten HTML agar memiliki alur yang baik, tata bahasa yang benar, dan struktur yang rapi (paragraf <p>, sub-judul <h2>/<h3> jika perlu, penebalan <strong> pada kata kunci). Pertahankan semua konten asli, jangan menghilangkannya.
    2.  **Summarize (Meringkas):** Setelah merapikan, buat ringkasan dari konten tersebut. Ringkasan harus dalam bentuk poin-poin HTML (menggunakan tag <ul> dan <li>) dan menyoroti ide-ide utama.

    HASILKAN OUTPUT HANYA DALAM FORMAT JSON YANG VALID dengan struktur berikut:
    {
      "konten_rapi": "Konten HTML yang sudah dirapikan ada di sini...",
      "ringkasan_poin": "<ul><li>Poin ringkasan pertama.</li><li>Poin ringkasan kedua.</li></ul>"
    }

    Konten HTML untuk diproses:
    ---
    ${combinedHtml}
    ---
    `.trim();

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
      const tidiedHtml = result.konten_rapi;
      const summaryHtml = result.ringkasan_poin;

      if (!tidiedHtml || !summaryHtml) {
        throw new Error("Respons AI tidak memiliki format JSON yang diharapkan.");
      }
      
      const newSections = [
        { title: 'Konten yang Diproses AI', content: tidiedHtml },
        { title: 'Ringkasan Poin Penting', content: summaryHtml }
      ];

      const newSectionsToSave = newSections.map(({ id, ...rest }) => rest);

      const { error: updateError } = await supabase
        .from('notes')
        .update({ sections: newSectionsToSave })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setSections(newSections.map(sec => ({...sec, id: crypto.randomUUID()})));
      alert('Catatan berhasil diproses dan disimpan otomatis!');

    } catch (error) {
      console.error("Error memproses catatan:", error);
      alert("Gagal memproses catatan: " + error.message);
    } finally {
      setIsProcessing(false);
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
            {/* --- TOMBOL LAMA DIHAPUS DAN DIGANTI DENGAN TOMBOL BARU --- */}
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
    </>
  );
}
export default NoteDetailPage;
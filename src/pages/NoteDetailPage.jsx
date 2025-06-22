// File: src/pages/NoteDetailPage.jsx
// Status: BERMASALAH. Ini adalah file yang perlu diperbaiki.
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
  }, [section.id]); // Pertahankan dependency array ini

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
        {/* Ini adalah input judul bagian yang dimaksud */}
        <input
          type="text"
          placeholder="Judul Bagian..."
          value={section.title}
          onChange={(e) => onTitleChange(e.target.value)}
          // Tambahkan atau pastikan styling yang cukup agar input terlihat jelas
          className="text-lg font-semibold bg-transparent w-full focus:outline-none dark:text-white px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md" // Tambahkan border dan padding
        />
        {/* Tombol hapus hanya muncul jika ada lebih dari satu bagian */}
        {onRemove && (
            <button type="button" onClick={onRemove} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0 ml-2">Hapus Bagian</button>
        )}
      </div>
      {/* Pastikan MenuBar dan EditorContent selalu dirender setelah editor siap */}
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

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
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
    };
    fetchNote();
  }, [id]);

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
    // Gunakan prevSections untuk mendapatkan state terbaru secara aman
    setSections(prevSections => {
      if (prevSections.length <= 1) {
        alert("Setidaknya harus ada satu bagian.");
        return prevSections; // Jangan ubah state jika hanya ada satu bagian
      }
      if (window.confirm("Yakin ingin menghapus bagian ini?")) {
        return prevSections.filter((_, i) => i !== index);
      }
      return prevSections; // Kembali ke state sebelumnya jika tidak jadi dihapus
    });
  }, []); // Hapus `sections` dari dependency array karena kita menggunakan `prevSections` callback

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

  const handleSummarize = async () => {
    const allText = sections.map(sec => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sec.content;
        return `Judul Bagian: ${sec.title}\n${tempDiv.textContent || tempDiv.innerText || ''}`;
    }).join('\n\n---\n\n');

    if (!allText.trim()) return alert("Tidak ada konten untuk dirangkum.");

    setIsSummarizing(true);
    try {
        const apiKey = await getApiKey();
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        const fullPrompt = `Tolong rangkum seluruh teks berikut menjadi beberapa poin penting atau satu paragraf singkat:\n\n---\n${allText}\n---`;
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
        const summary = data.candidates[0].content.parts[0].text;
        alert("✨ Ringkasan AI:\n\n" + summary);
    } catch (error) {
        alert("Gagal membuat rangkuman: " + error.message);
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleTidyUp = async () => {
    const combinedHtml = sections.map(sec => `<h2>${sec.title}</h2>${sec.content}`).join('');
    if (!combinedHtml.trim()) return alert("Tidak ada konten untuk dirapikan.");

    setIsTidying(true);
    try {
        const apiKey = await getApiKey();
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        const fullPrompt = `Anda adalah asisten editor yang andal. Tugas Anda adalah merapikan konten HTML berikut. Perbaiki semua kesalahan ejaan dan tata bahasa. Pertahankan struktur HTML. Output HANYA HTML yang sudah dirapikan.\n\nKonten:\n---\n${combinedHtml}\n---`;
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
        const tidiedHtml = data.candidates[0].content.parts[0].text;

        setSections([{ id: crypto.randomUUID(), title: 'Konten yang Dirapikan AI', content: tidiedHtml }]);
    } catch (error) {
        alert("Gagal merapikan catatan: " + error.message);
    } finally {
        setIsTidying(false);
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
            <button type="button" onClick={handleTidyUp} disabled={isTidying || isSummarizing} className="px-6 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 disabled:bg-gray-400">
                {isTidying ? 'Merapikan...' : 'Rapikan AI 🧹'}
            </button>
            <button type="button" onClick={handleSummarize} disabled={isSummarizing || isTidying} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
                {isSummarizing ? 'Menganalisis...' : 'Rangkum AI'}
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
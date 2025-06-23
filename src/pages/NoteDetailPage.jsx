// File: src/pages/NoteDetailPage.jsx
// Status: Versi Final - Lengkap dengan Simpan Otomatis dan Semua Fitur Utuh.

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

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

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

  const getSpecializedTidyUpPrompt = (contentType, combinedHtml) => {
    let prompt = '';
    switch (contentType.toLowerCase()) {
      case 'narasi':
      case 'cerita pendek':
        prompt = `
Anda adalah seorang Editor Naratif AI yang sangat terampil. Tugas utama Anda adalah mengubah teks cerita yang terfragmentasi atau tidak terstruktur menjadi sebuah narasi yang mengalir, menarik, dan diformat secara profesional dalam HTML.

**Prioritas Utama: Membentuk Ulang Paragraf yang Mengalir**
Ini adalah tugas terpenting. Abaikan pemisah baris asli dalam input jika itu memutus alur kalimat atau ide. Anda HARUS menggabungkan kalimat-kalimat yang terputus menjadi paragraf (<p>) yang kohesif dan logis. Buatlah narasi yang mulus dan enak dibaca, bukan sekadar daftar kalimat.

**Contoh Tugas Membentuk Ulang Paragraf:**
* **INPUT BURUK:**
    <p>Berabad-abad lamanya, kisah tentang seorang raja yang berkuasa,</p>
    <p>kerajaannya yang megah, dan tragedi yang menimpa pasukannya di tengah lautan,</p>
    <p>telah menghiasi lembaran sejarah dan kitab suci.</p>
* **OUTPUT YANG DIINGINKAN (Paragraf Utuh):**
    <p>Berabad-abad lamanya, kisah tentang seorang raja yang berkuasa, kerajaannya yang megah, dan tragedi yang menimpa pasukannya di tengah lautan, telah menghiasi lembaran sejarah dan kitab suci.</p>

**Instruksi Tambahan:**
1.  **Struktur dengan Sub-Judul:** Analisis alur cerita. Jika Anda menemukan perubahan adegan, waktu, atau fokus topik yang jelas (misalnya dari pengenalan ke pelarian), buatlah sub-judul yang relevan menggunakan tag <h2> atau <h3>.
2.  **Penebalan Semantik:** Secara cerdas, tebalkan (menggunakan <strong>) nama tokoh kunci (Firaun, Musa), tempat penting (Laut Merah), atau konsep dramatis (kesombongan, mukjizat, kebebasan) untuk memberikan penekanan.
3.  **Koreksi Ejaan & Tata Bahasa:** Perbaiki semua kesalahan penulisan.
4.  **Format Output JSON:** Hasil akhir Anda HARUS berupa objek JSON yang valid dengan kunci "cleaned_html" dan "analysis".

Sekarang, proses konten HTML berikut sesuai dengan semua instruksi di atas:
---
${combinedHtml}
---
        `;
        break;

      case 'edukasi':
      case 'tutorial':
        prompt = `
Anda adalah seorang instruktur teknis dan editor dokumentasi. Tugas Anda adalah merapikan dan memformat ulang konten HTML yang diberikan untuk kejelasan, akurasi, dan kemudahan belajar.

Instruksi:
1.  **Koreksi Ejaan & Tata Bahasa:** Perbaiki semua kesalahan.
2.  **Penebalan Semantik (Bold):** Tebalkan istilah teknis kunci, nama perintah, nama file, dan konsep penting untuk penekanan dan kemudahan pemindaian.
3.  **Konversi ke Format Daftar (List):** Ubah langkah-langkah, daftar persyaratan, atau poin-poin menjadi daftar HTML yang sesuai (\`<ol>\` untuk langkah-langkah berurutan, \`<ul>\` untuk daftar tidak berurutan).
4.  **Peningkatan Struktur Teknis:**
    * **Sub-Judul:** Gunakan \`<h3>\` atau \`<h4>\` untuk memecah topik besar menjadi bagian yang lebih mudah dicerna.
    * **Paragraf & Baris:** Pastikan setiap paragraf dibungkus \`<p>\`. Pecah paragraf panjang. Gunakan \`<br>\` atau \`<p>\` kosong untuk pemisahan yang jelas antar bagian.
    * **Contoh Kode/Output:** Jika ada teks yang terlihat seperti kode atau output terminal, bungkus dalam \`<pre><code>\` tag.
5.  **Format Output JSON:** Hasil Anda HARUS berupa objek JSON dengan dua kunci utama: \`"cleaned_html"\` dan \`"analysis"\`.

Konten HTML Panduan/Tutorial:
---
${combinedHtml}
---
        `;
        break;

      case 'skrip':
      case 'dialog':
        prompt = `
Anda adalah seorang penulis dan editor skrip dialog. Tugas Anda adalah merapikan konten HTML skrip yang diberikan, memprioritaskan mempertahankan format dialog dan identitas pembicara.

Instruksi:
1.  **Koreksi Ejaan & Tata Bahasa:** Perbaiki kesalahan minim tanpa mengubah esensi dialog.
2.  **Penebalan:** Jangan menebalkan kata apa pun kecuali sudah ditebalkan di input asli atau jika ada indikasi penekanan spesifik pada dialog.
3.  **Struktur Dialog:** Pertahankan format 'Nama: Dialog'. Setiap baris dialog dari pembicara yang berbeda atau perubahan topik harus berada di paragraf \`<p>\` yang terpisah. Jangan gabungkan dialog dari pembicara yang berbeda dalam satu paragraf.
4.  **Format Output JSON:** Hasil Anda HARUS berupa objek JSON dengan dua kunci utama: \`"cleaned_html"\` dan \`"analysis"\`.

Konten HTML Skrip/Dialog:
---
${combinedHtml}
---
        `;
        break;
      
      case 'puisi':
      case 'lirik':
        prompt = `
Anda adalah seorang penyair dan editor lirik. Tugas Anda adalah merapikan konten HTML puisi/lirik yang diberikan, memprioritaskan mempertahankan struktur baris dan bait asli.

Instruksi:
1.  **Koreksi Ejaan & Tata Bahasa:** Perbaiki kesalahan minim tanpa mengubah esensi kata.
2.  **Struktur Baris Asli (Sangat Penting):** **Pertahankan setiap baris baru persis seperti aslinya.** Gunakan \`<br>\` untuk setiap pemisah baris asli dan pisahkan bait dengan beberapa \`<p>\` kosong. JANGAN mengubahnya menjadi paragraf (\`<p>\`) biasa jika itu merusak struktur puisi/lirik.
3.  **Penebalan:** Jangan menebalkan kata apa pun kecuali sudah ditebalkan di input asli, atau jika ada instruksi khusus yang jelas.
4.  **Format Output JSON:** Hasil Anda HARUS berupa objek JSON dengan dua kunci utama: \`"cleaned_html"\` dan \`"analysis"\`.

Konten HTML Puisi/Lirik:
---
${combinedHtml}
---
        `;
        break;

      case 'daftar':
      case 'data mentah':
        prompt = `
Anda adalah seorang ahli data dan formatter daftar. Tugas Anda adalah merapikan dan memformat ulang konten HTML yang diberikan menjadi daftar yang jelas dan terstruktur.

Instruksi:
1.  **Koreksi Ejaan & Tata Bahasa:** Perbaiki hanya kesalahan ejaan yang jelas.
2.  **Penebalan:** Tebalkan kata kunci utama pada setiap item daftar jika itu membantu kejelasan.
3.  **Konversi ke Daftar HTML:** Ubah setiap item atau baris data mentah menjadi item daftar (\`<li>\`) dalam daftar HTML (\`<ul>\` atau \`<ol>\`) yang sesuai. Pastikan setiap item terpisah.
4.  **Struktur Minimal:** Pertahankan perubahan minimal pada struktur asli selain mengubahnya menjadi daftar. Jangan menambahkan teks pengantar atau penutup.
5.  **Format Output JSON:** Hasil Anda HARUS berupa objek JSON dengan dua kunci utama: \`"cleaned_html"\` dan \`"analysis"\`.

Konten HTML Daftar/Data Mentah:
---
${combinedHtml}
---
        `;
        break;

      default: // Prompt default jika tipe konten tidak cocok dengan spesialisasi di atas
        prompt = `
Anda adalah asisten editor dan formatter cerdas yang sangat andal. Tugas Anda adalah menganalisis, merapikan, dan memformat ulang konten HTML yang diberikan.

Berikut adalah instruksi Anda:
1.  **Koreksi Ejaan dan Tata Bahasa:** Perbaiki semua kesalahan ejaan dan tata bahasa yang ada di seluruh teks.
2.  **Penebalan Semantik (Bold):** Identifikasi kata kunci penting, frasa kunci, dan konsep-konsep utama yang esensial untuk pemahaman. Tebalkan kata atau frasa ini dengan membungkusnya dalam tag \`<strong>\` HTML. Jangan berlebihan dalam menebalkan; hanya tebalkan istilah yang benar-benar meningkatkan kejelasan atau merupakan fokus utama.
3.  **Konversi ke Format Daftar (List):** Analisis teks untuk urutan item, langkah-langkah, atau poin-poin yang terpisah. Jika struktur daftar tersirat atau sesuai, konversikan menjadi daftar HTML yang benar (\`<ul>\` untuk daftar tidak terurut atau \`<ol>\` untuk daftar terurut).
4.  **Peningkatan Struktur dan Keterbacaan HTML (Sangat Penting):**
    * Prioritaskan keterbacaan dan kejelasan alur konten.
    * Jika ada teks yang sangat panjang tanpa pemisah paragraf atau baris baru yang jelas, **analisis kontennya untuk menemukan jeda logis dan pisahkan menjadi paragraf-paragraf baru yang sesuai dengan membungkusnya dalam tag \`<p>\`**. Pastikan setiap paragraf baru dimulai di baris baru.
    * Jika ada bagian-bagian yang terasa seperti sub-bagian, sub-topik, atau 'bab' tersendiri dalam konteks cerita atau panduan, meskipun tidak ditandai secara eksplisit, **sisipkan pemisah paragraf yang jelas (misal: beberapa \`<p>\` kosong) atau tambahkan judul semantik yang sesuai (misal: \`<h3>\` atau \`<h4>\`) jika sangat relevan untuk struktur yang lebih baik**.
    * Pastikan setiap paragraf baru dibungkus dengan tag \`<p>\`.
    * Tambahkan \`<br>\` untuk baris baru atau pemisah visual di dalam paragraf jika diperlukan untuk keterbacaan (misal: setelah poin pendek di dalam paragraf yang tidak cukup untuk menjadi list).
5.  **Format Output JSON:** Hasil Anda HARUS berupa objek JSON dengan dua kunci utama: \`"cleaned_html"\` dan \`"analysis"\`.

Konten HTML yang akan diproses:
---
${combinedHtml}
---
        `;
        break;
    }
    return prompt.trim();
  };

  const handleTidyUp = async () => {
    const combinedHtml = sections.map(sec => `<h2>${sec.title}</h2>${sec.content}`).join('');
    if (!combinedHtml.trim()) return alert("Tidak ada konten untuk dirapikan.");

    setIsTidying(true);
    setAnalysisResult(null);

    try {
      const apiKey = await getApiKey();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      
      const analysisPrompt = `
Analisis teks HTML berikut dan tentukan TIPE UTAMA KONTENNYA.
Pilih HANYA SATU KATA dari pilihan berikut:
Narasi, Edukasi, Tutorial, Skrip, Dialog, Puisi, Lirik, Daftar, Data Mentah, Umum.
Output Anda HARUS berupa objek JSON dengan kunci "type" dan "keywords" (2-3 kata kunci penting dari konten).
Contoh output: {"type": "Narasi", "keywords": ["petualangan", "hutan", "rahasia"]}
Konten HTML untuk dianalisis:
---
${combinedHtml}
---
      `.trim();

      const analysisResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: analysisPrompt }] }] })
      });
      if (!analysisResponse.ok) {
          const errorBody = await analysisResponse.json();
          throw new Error(`API analysis request failed: ${errorBody.error.message}`);
      }
      const analysisData = await analysisResponse.json();
      let rawAnalysisText = analysisData.candidates[0].content.parts[0].text;
      
      if (rawAnalysisText.startsWith('```json')) {
          rawAnalysisText = rawAnalysisText.substring(7, rawAnalysisText.lastIndexOf('```')).trim();
      } else if (rawAnalysisText.startsWith('```')) {
          rawAnalysisText = rawAnalysisText.substring(3, rawAnalysisText.lastIndexOf('```')).trim();
      }
      
      const initialAnalysis = JSON.parse(rawAnalysisText);
      setAnalysisResult(initialAnalysis);

      const contentType = initialAnalysis.type || 'Umum';
      
      const specializedPrompt = getSpecializedTidyUpPrompt(contentType, combinedHtml);

      const tidyUpResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: specializedPrompt }] }] })
      });
      if (!tidyUpResponse.ok) {
          const errorBody = await tidyUpResponse.json();
          throw new Error(`API tidy up request failed: ${errorBody.error.message}`);
      }
      const tidyUpData = await tidyUpResponse.json();
      let rawTidyUpText = tidyUpData.candidates[0].content.parts[0].text;
      if (rawTidyUpText.startsWith('```json')) {
          rawTidyUpText = rawTidyUpText.substring(7, rawTidyUpText.lastIndexOf('```')).trim();
      } else if (rawTidyUpText.startsWith('```')) {
          rawTidyUpText = rawTidyUpText.substring(3, rawTidyUpText.lastIndexOf('```')).trim();
      }
      
      const parsedTidyUpResult = JSON.parse(rawTidyUpText);
      const tidiedHtml = parsedTidyUpResult.cleaned_html;
      
      // Siapkan data baru untuk disimpan
      const newSectionsToSave = [{ title: 'Konten yang Dirapikan AI', content: tidiedHtml }];
      
      // Kirim pembaruan ke database Supabase
      const { error: updateError } = await supabase
        .from('notes')
        .update({ sections: newSectionsToSave })
        .eq('id', id);

      if (updateError) {
        throw updateError; // Jika gagal menyimpan, lempar error
      }

      // Jika berhasil, perbarui "Meja Kerja" (state) dan beri notifikasi
      setSections(newSectionsToSave.map(sec => ({...sec, id: crypto.randomUUID()})));
      alert('Catatan berhasil dirapikan dan disimpan otomatis!');

    } catch (error) {
        console.error("Error merapikan catatan:", error);
        alert("Gagal merapikan dan menyimpan catatan: " + error.message);
        setAnalysisResult(null);
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

        {analysisResult && (
            <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-2 dark:text-white">Analisis AI</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-medium">Jenis Konten:</span> {analysisResult.type}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Kata Kunci:</span> {analysisResult.keywords?.join(', ') || 'Tidak ada'}
                </p>
            </div>
        )}

        <div className="mt-6 pt-6 border-t dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={addSection} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
            + Tambah Bagian
          </button>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleTidyUp} disabled={isTidying || isSummarizing} className="px-6 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 disabled:bg-gray-400">
                {isTidying ? 'Merapikan & Menganalisis...' : 'Rapikan & Analisis AI 🧹'}
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
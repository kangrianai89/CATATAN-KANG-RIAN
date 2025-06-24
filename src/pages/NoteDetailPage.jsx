import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const SpinnerIcon = () => ( <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const MenuBar = ({ editor }) => { if (!editor) return null; const buttonClass = "px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"; return ( <div className="p-2 border-x border-t dark:border-gray-600 rounded-t-lg bg-gray-100 dark:bg-gray-900/50 flex flex-wrap gap-2 tiptap"> <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}>H1</button> <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}>H2</button> <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={`${buttonClass} ${editor.isActive('paragraph') ? 'is-active' : ''}`}>Paragraf</button> <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${buttonClass} ${editor.isActive('bold') ? 'is-active' : ''}`}>Bold</button> <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${buttonClass} ${editor.isActive('italic') ? 'is-active' : ''}`}>Italic</button> <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${buttonClass} ${editor.isActive('strike') ? 'is-active' : ''}`}>Strike</button> <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${buttonClass} ${editor.isActive('bulletList') ? 'is-active' : ''}`}>List</button> <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${buttonClass} ${editor.isActive('orderedList') ? 'is-active' : ''}`}>List Angka</button> <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${buttonClass} ${editor.isActive('codeBlock') ? 'is-active' : ''}`}>Code Block</button> </div> ); };
const EditorSection = ({ section, onTitleChange, onContentChange, onRemove, onSmartProcess, isProcessing, onSectionFocus }) => { const contentTimeoutRef = useRef(null); const scrollContainerRef = useRef(null); const scrollTimeoutRef = useRef(null); const scrollSessionKey = `scroll-pos-${section.id}`; const debouncedContentUpdate = useCallback((editor) => { if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current); contentTimeoutRef.current = setTimeout(() => { onContentChange(editor.getHTML()); }, 500); }, [onContentChange]); const handleScroll = useCallback(() => { if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); scrollTimeoutRef.current = setTimeout(() => { if (scrollContainerRef.current) { sessionStorage.setItem(scrollSessionKey, scrollContainerRef.current.scrollTop); } }, 200); }, [scrollSessionKey]); const editor = useEditor({ extensions: [StarterKit], content: section.content || '', onUpdate: ({ editor }) => { debouncedContentUpdate(editor); }, editorProps: { attributes: { class: 'prose dark:prose-invert max-w-none p-4 focus:outline-none' } }, }, [section.id]); useEffect(() => { if (editor) { const savedScrollTop = sessionStorage.getItem(scrollSessionKey); if (savedScrollTop) { requestAnimationFrame(() => { if (scrollContainerRef.current) { scrollContainerRef.current.scrollTop = parseInt(savedScrollTop, 10); } }); } } }, [editor, scrollSessionKey]); const isAIBlock = section.title.includes('(Diproses AI)'); const wrapperClass = isAIBlock ? "p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20 space-y-3" : "p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 space-y-3"; if (!editor) return null; return ( <div id={section.id} onFocus={() => onSectionFocus(section.id)} className={wrapperClass}> <input type="text" placeholder="Judul Bagian..." value={section.title} onChange={(e) => onTitleChange(e.target.value)} className="text-lg font-semibold bg-transparent w-full focus:outline-none dark:text-white px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md" /> <div ref={scrollContainerRef} onScroll={handleScroll} className="border dark:border-gray-600 rounded-b-lg min-h-[200px] max-h-[500px] overflow-y-auto bg-white dark:bg-gray-700"> <MenuBar editor={editor} /><EditorContent editor={editor} /> </div> <div className="flex items-center justify-end gap-2 pt-3"> <button type="button" onClick={onSmartProcess} disabled={isProcessing} className="inline-flex items-center px-3 py-1 text-sm bg-purple-500 text-white font-semibold rounded-md hover:bg-purple-600 disabled:bg-gray-400"> {isProcessing ? ( <><SpinnerIcon /><span>Memproses...</span></> ) : ( 'Rapikan & Rangkum' )} </button> {onRemove && (<button type="button" onClick={onRemove} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Hapus Bagian</button>)} </div> </div> ); };

function NoteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);
    const [processingSectionIndex, setProcessingSectionIndex] = useState(null);
    const sessionStorageKey = `unsaved-note-${id}`;
    const lastActiveSectionKey = `last-active-section-${id}`;
    const assignStableIds = (sectionsArray) => sectionsArray.map(sec => ({ ...sec, id: sec.id || crypto.randomUUID() }));
    const fetchCategories = useCallback(async () => { try { const { data, error } = await supabase.from('categories').select('id, name').order('name', { ascending: true }); if (error) throw error; setCategories(data); } catch (error) { alert("Gagal memuat daftar kategori: " + error.message); } }, []);
    const fetchNote = useCallback(async () => { if (!id) return; setLoading(true); try { const { data, error } = await supabase.from('notes').select('title, sections, category_id').eq('id', id).single(); if (error) throw error; setTitle(data.title || ''); setSections(assignStableIds(data.sections || [])); setSelectedCategoryId(data.category_id || ''); } catch (error) { alert("Gagal memuat catatan: " + error.message); } finally { setLoading(false); } }, [id]);
    useEffect(() => { fetchCategories(); const savedDraft = sessionStorage.getItem(sessionStorageKey); if (savedDraft) { const parsedData = JSON.parse(savedDraft); setTitle(parsedData.title); setSections(assignStableIds(parsedData.sections)); setSelectedCategoryId(parsedData.category_id || ''); setLoading(false); } else { fetchNote(); } }, [id, fetchCategories, fetchNote]);
    useEffect(() => { if (!loading) { const dataToSave = { title, sections, category_id: selectedCategoryId }; sessionStorage.setItem(sessionStorageKey, JSON.stringify(dataToSave)); } }, [title, sections, selectedCategoryId, loading, sessionStorageKey]);
    useEffect(() => { if (!loading) { const lastActiveId = sessionStorage.getItem(lastActiveSectionKey); if (lastActiveId) { const element = document.getElementById(lastActiveId); if (element) { setTimeout(() => { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); } } } }, [loading, lastActiveSectionKey]);
    const handleUpdateSection = useCallback((index, field, value) => setSections(prev => { const newSections = [...prev]; newSections[index][field] = value; return newSections; }), []);
    const addSection = useCallback(() => setSections(prev => [...prev, { id: crypto.randomUUID(), title: 'Bagian Baru', content: '' }]), []);
    const removeSection = useCallback((index) => setSections(prev => { if (prev.length <= 1) { alert("Setidaknya harus ada satu bagian."); return prev; } if (window.confirm("Yakin ingin menghapus bagian ini?")) { return prev.filter((_, i) => i !== index); } return prev; }), []);
    const handleSetActiveSection = (sectionId) => sessionStorage.setItem(lastActiveSectionKey, sectionId);
    const handleCreateCategory = async () => { if (!newCategoryName.trim()) return; setIsCreatingCategory(true); try { const { data: { user } } = await supabase.auth.getUser(); const { data, error } = await supabase.from('categories').insert({ name: newCategoryName, user_id: user.id }).select().single(); if (error) throw error; const newCategories = [...categories, data].sort((a, b) => a.name.localeCompare(b.name)); setCategories(newCategories); setSelectedCategoryId(data.id); setNewCategoryName(''); setShowAddCategory(false); } catch (error) { alert(error.message); } finally { setIsCreatingCategory(false); } };
    const handleDeleteCategory = async () => { if (!selectedCategoryId) return; const categoryToDelete = categories.find(c => c.id === selectedCategoryId); if (!categoryToDelete) return; if (window.confirm(`Yakin ingin menghapus kategori "${categoryToDelete.name}"?\nSemua catatan yang menggunakan kategori ini akan dilepaskan.\nTindakan ini tidak bisa dibatalkan.`)) { setIsDeletingCategory(true); try { await supabase.from('notes').update({ category_id: null }).eq('category_id', selectedCategoryId); await supabase.from('categories').delete().eq('id', selectedCategoryId); setCategories(categories.filter(c => c.id !== selectedCategoryId)); setSelectedCategoryId(''); alert(`Kategori "${categoryToDelete.name}" berhasil dihapus.`); } catch (error) { alert(error.message); } finally { setIsDeletingCategory(false); } } };
    const handleUpdateNote = async (e) => { e.preventDefault(); try { const sectionsToSave = sections.map(({ id, ...rest }) => rest); const categoryToSave = selectedCategoryId === '' ? null : selectedCategoryId; await supabase.from('notes').update({ title, sections: sectionsToSave, updated_at: new Date().toISOString(), category_id: categoryToSave }).eq('id', id); sessionStorage.removeItem(sessionStorageKey); sessionStorage.removeItem(lastActiveSectionKey); sections.forEach(sec => sessionStorage.removeItem(`scroll-pos-${sec.id}`)); alert('Catatan berhasil diperbarui!'); } catch (error) { alert(error.message); } };
    const getApiKey = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Pengguna tidak terautentikasi."); const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single(); if (profile && profile.gemini_api_key) return profile.gemini_api_key; const mainApiKey = import.meta.env.VITE_GEMINI_API_KEY; if (mainApiKey) return mainApiKey; throw new Error("API Key Gemini belum diatur di Pengaturan Akun atau di variabel lingkungan."); };
    
    const handleSmartProcess = async (sectionIndex) => {
        setProcessingSectionIndex(sectionIndex);
        try {
            const sectionToProcess = sections[sectionIndex];
            const combinedHtml = `<h2>${sectionToProcess.title}</h2>${sectionToProcess.content}`;
            if (!sectionToProcess.content.trim()) {
                return alert("Tidak ada konten untuk diproses di bagian ini.");
            }
            const apiKey = await getApiKey();
            if (!apiKey) throw new Error("API Key tidak ditemukan setelah semua pengecekan.");
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
            const smartPrompt = `Anda adalah seorang analis konten dan editor ahli. Diberikan konten HTML dari sebuah bagian catatan, lakukan dua tugas berikut secara berurutan:\n1.  **Tidy Up (Merapikan):** Analisis dan rapikan seluruh konten HTML agar memiliki alur yang baik, tata bahasa yang benar, dan struktur yang rapi (paragraf <p>, sub-judul <h2>/<h3> jika perlu, penebalan <strong> pada kata kunci). Pertahankan semua konten asli, jangan menghilangkannya.\n2.  **Summarize & Analyze (Meringkas & Menganalisis):** Setelah merapikan, buat analisis dan ringkasan mendalam dari konten tersebut.\n    * **Format:** Hasilnya HARUS dalam bentuk poin-poin HTML (menggunakan tag <ul> dan <li>).\n    * **Kuantitas:** Hasilkan **minimal 3 hingga 5 poin** yang paling signifikan.\n    * **Kualitas:** Setiap poin harus berupa kalimat lengkap dan informatif.\n\nHASILKAN OUTPUT HANYA DALAM FORMAT JSON YANG VALID dengan struktur berikut:\n{\n  "konten_rapi": "Konten HTML yang sudah dirapikan ada di sini...",\n  "ringkasan_poin": "<ul><li>Poin ringkasan pertama.</li><li>Poin ringkasan kedua.</li></ul>"\n}\n\nKonten HTML untuk diproses:\n---\n${combinedHtml}\n---`.trim();
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: smartPrompt }] }] }) });
            if (!response.ok) { const errorBody = await response.json(); throw new Error(`API request failed: ${errorBody.error.message}`); }
            const data = await response.json();
            const rawJsonText = data.candidates[0].content.parts[0].text;
            let processedText = rawJsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
            const result = JSON.parse(processedText);

            // --- PERUBAHAN LOGIKA FINAL DI SINI ---
            const newTitle = `${sectionToProcess.title} (Diproses AI)`;
            const newContent = `${result.konten_rapi}<br><hr><h3>Ringkasan Poin Penting:</h3>${result.ringkasan_poin}`;
            const updatedSection = { ...sectionToProcess, title: newTitle, content: newContent };
            setSections(prevSections => {
                const newSections = [...prevSections];
                newSections[sectionIndex] = updatedSection;
                return newSections;
            });
            alert('Bagian berhasil diproses dan digabungkan!');

        } catch (error) {
            console.error("Terjadi error di dalam handleSmartProcess:", error);
            alert("Gagal memproses bagian: " + error.message);
        } finally {
            setProcessingSectionIndex(null);
        }
    };
    
    if (loading) return <div className="p-8 dark:text-gray-300">Memuat catatan...</div>;

    return (
        <>
            <div className="flex justify-between items-center mb-4"><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Catatan</h1><Link to={`/note/${id}`} className="text-blue-500 hover:underline">&larr; Kembali ke Halaman Baca</Link></div>
            <form onSubmit={handleUpdateNote}>
                <div className="mb-4"><label htmlFor="main-title" className="block text-xl font-semibold mb-2 text-gray-900 dark:text-white">Judul Utama Catatan</label><input id="main-title" type="text" className="w-full text-2xl font-bold px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="mb-6 space-y-2">
                    <div className="flex justify-between items-center"><label htmlFor="category-select" className="block text-lg font-semibold text-gray-900 dark:text-white">Kategori</label><button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="text-sm text-blue-500 hover:underline">{showAddCategory ? 'Batal' : '[+ Tambah Baru]'}</button></div>
                    {showAddCategory ? ( <div className="flex items-center gap-2"><input type="text" placeholder="Nama kategori baru..." className="w-full flex-grow px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} /><button type="button" onClick={handleCreateCategory} disabled={isCreatingCategory} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-400">{isCreatingCategory ? '...' : 'Simpan'}</button></div> ) : ( <div className="flex items-center gap-2"><select id="category-select" className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}><option value="">-- Tanpa Kategori --</option>{categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}</select><button type="button" onClick={handleDeleteCategory} disabled={!selectedCategoryId || isDeletingCategory} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed" title="Hapus Kategori Terpilih"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></div> )}
                </div>
                <div className="space-y-6">{sections.map((section, index) => (<EditorSection key={section.id} section={section} onTitleChange={(newTitle) => handleUpdateSection(index, 'title', newTitle)} onContentChange={(newContent) => handleUpdateSection(index, 'content', newContent)} onRemove={sections.length > 1 ? () => removeSection(index) : null} onSmartProcess={() => handleSmartProcess(index)} isProcessing={processingSectionIndex === index} onSectionFocus={handleSetActiveSection} />))}</div>
                <div className="mt-6 pt-6 border-t dark:border-gray-700 flex flex-wrap items-center justify-between gap-4"><button type="button" onClick={addSection} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">+ Tambah Bagian</button><div className="flex flex-wrap gap-2"><button type="submit" className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Simpan Seluruh Catatan</button></div></div>
            </form>
        </>
    );
}

export default NoteDetailPage;
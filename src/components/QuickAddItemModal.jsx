import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../supabaseClient';
import MenuBar from './MenuBar';

function QuickAddItemModal({ isOpen, onClose, user, parentNoteId, onItemAdded }) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Kunci unik untuk draf di localStorage, berdasarkan folder induk
    const draftKey = `new-note-draft-${parentNoteId || 'root'}`;

    // --- Fungsi untuk menyimpan draf ---
    const saveDraft = useCallback((currentTitle, editorInstance) => {
        if (!editorInstance) return;
        const draftData = { title: currentTitle, content: editorInstance.getHTML() };
        // PERUBAHAN: Menggunakan localStorage untuk penyimpanan yang lebih permanen
        localStorage.setItem(draftKey, JSON.stringify(draftData));
    }, [draftKey]);

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none',
            },
        },
        // Setiap kali konten editor berubah, simpan draf
        onUpdate: ({ editor: editorInstance }) => {
            saveDraft(title, editorInstance);
        },
    });

    // --- Efek untuk memuat atau membersihkan draf saat modal dibuka/ditutup ---
    useEffect(() => {
        if (isOpen && editor) {
            // PERUBAHAN: Mengambil draf dari localStorage
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                console.log('📝 Draf ditemukan, memuat draf baru...');
                const draft = JSON.parse(savedDraft);
                setTitle(draft.title);
                editor.commands.setContent(draft.content, false);
            } else {
                // Jika tidak ada draf, pastikan form bersih
                setTitle('');
                editor.commands.clearContent();
            }
        }
    }, [isOpen, editor, draftKey]);
    
    // --- Handler untuk input judul, sekaligus menyimpan draf ---
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        saveDraft(newTitle, editor);
    };

    // --- Fungsi untuk membersihkan draf dan menutup modal ---
    const handleClose = () => {
        // PERUBAHAN: Menghapus draf dari localStorage
        localStorage.removeItem(draftKey);
        onClose();
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Judul catatan harus diisi!');
            return;
        }
        setIsSaving(true);
        const content = editor.getHTML();

        const dataToSave = {
            title: title,
            content: content,
            user_id: user.id,
            type: 'note',
            parent_id: parentNoteId,
        };

        try {
            const { data, error } = await supabase.from('workspace_items').insert(dataToSave).select().single();
            if (error) throw error;

            alert('Catatan baru berhasil dibuat!');
            // PERUBAHAN: Menghapus draf dari localStorage setelah berhasil disimpan
            localStorage.removeItem(draftKey); 
            onItemAdded(data);
            onClose(); // Tutup modal asli

        } catch (err) {
            alert('Gagal membuat catatan: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Buat Catatan Baru</h2>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Judul Catatan</label>
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange} // Menggunakan handler baru
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Konten</label>
                        <div className="border rounded-lg dark:border-gray-600">
                            <MenuBar editor={editor} />
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-4">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-black dark:text-white rounded-md">Batal</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuickAddItemModal;

// src/components/NoteItemEditModal.jsx

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from './MenuBar';

function NoteItemEditModal({ isOpen, onClose, item, onSave, folders }) {
    const [title, setTitle] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Fungsi untuk menyimpan draf, dibuat dengan useCallback agar tidak dibuat ulang terus-menerus
    const saveDraft = useCallback(() => {
        if (!editor || !item) return;

        const draftData = {
            title: title,
            content: editor.getHTML(),
        };
        const draftKey = `note-draft-${item.id}`;
        
        // Hanya simpan jika ada judul atau konten
        if (draftData.title || draftData.content !== '<p></p>') {
            sessionStorage.setItem(draftKey, JSON.stringify(draftData));
            console.log('✅ Draf disimpan untuk item:', item.id);
        }
    }, [title, item]); // Bergantung pada 'title' dan 'item'

    const editor = useEditor({
        extensions: [StarterKit],
        content: '', // Konten akan diisi oleh useEffect
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none',
            },
        },
        // Setiap kali konten editor diubah, panggil fungsi saveDraft
        onUpdate: () => {
            saveDraft();
        },
    });

    // EFEK 1: Hanya untuk memuat data di awal
    useEffect(() => {
        if (item && editor) {
            const draftKey = `note-draft-${item.id}`;
            const savedDraft = sessionStorage.getItem(draftKey);

            if (savedDraft) {
                console.log('📝 Draf ditemukan, memuat draf untuk item:', item.id);
                const { title: draftTitle, content: draftContent } = JSON.parse(savedDraft);
                setTitle(draftTitle);
                // Set konten editor tanpa memicu 'onUpdate' untuk menghindari loop
                editor.commands.setContent(draftContent, false); 
            } else {
                console.log('📄 Tidak ada draf, memuat data asli untuk item:', item.id);
                setTitle(item.title);
                editor.commands.setContent(item.content || '', false);
            }
            setSelectedFolderId(item.note_id);
        }
    }, [item, editor]); // Hanya berjalan ketika item atau editor instance siap

    // EFEK 2: Menyimpan draf setiap kali judul berubah
    useEffect(() => {
        // Jangan simpan draf saat komponen pertama kali render sebelum editor siap
        if (editor && editor.isFocused) {
            saveDraft();
        }
    }, [title, saveDraft, editor]);

    const handleSave = async () => {
        if (!editor) return;
        setIsSaving(true);
        const finalContent = editor.getHTML();
        await onSave(item.id, title, finalContent, selectedFolderId);

        // Hapus draf dari sessionStorage setelah berhasil disimpan
        const draftKey = `note-draft-${item.id}`;
        sessionStorage.removeItem(draftKey);
        console.log('🗑️ Draf dihapus setelah disimpan:', item.id);
        
        setIsSaving(false);
        onClose();
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Edit Item Catatan</h2>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    {/* FORM UNTUK PINDAH FOLDER */}
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Pindahkan ke Folder</label>
                        <select
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Judul Item</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-black dark:text-white rounded-md">Batal</button>
                    <button onClick={handleSave} disabled={isSaving || !editor} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
            </div>
        </div>
    );
}

export default NoteItemEditModal;
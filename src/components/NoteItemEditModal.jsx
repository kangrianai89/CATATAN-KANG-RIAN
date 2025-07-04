// src/components/NoteItemEditModal.jsx

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from './MenuBar';

function NoteItemEditModal({ isOpen, onClose, item, onSave, folders }) { // Tambah prop 'folders'
    const [title, setTitle] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState(''); // State baru untuk folder tujuan
    const [isSaving, setIsSaving] = useState(false);

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none',
            },
        },
    });

    useEffect(() => {
        if (item && editor) {
            setTitle(item.title);
            setSelectedFolderId(item.note_id); // Set folder awal saat modal dibuka
            editor.commands.setContent(item.content || '');
        }
    }, [item, editor]);

    const handleSave = async () => {
        setIsSaving(true);
        const content = editor.getHTML();
        // Kirim folderId yang baru ke fungsi onSave
        await onSave(item.id, title, content, selectedFolderId);
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
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
            </div>
        </div>
    );
}

export default NoteItemEditModal;
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from './MenuBar'; // Menggunakan MenuBar yang sudah ada

function QuickAddItemModal({ isOpen, onClose, folders, user, onItemAdded }) {
    const [newItemTitle, setNewItemTitle] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: { class: 'prose dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none' },
        },
    });

    const handleAddItem = async (e) => {
        e.preventDefault();
        const content = editor ? editor.getHTML() : '';
        if (!newItemTitle.trim() || content === '<p></p>' || !selectedFolder) {
            alert("Judul, Konten, dan pilihan Folder harus diisi!");
            return;
        }
        try {
            const { data, error } = await supabase.from('note_items').insert({
                note_id: selectedFolder,
                user_id: user.id,
                title: newItemTitle,
                content: content
            }).select().single();

            if (error) throw error;
            
            setNewItemTitle('');
            if (editor) editor.commands.clearContent();
            setSelectedFolder('');

            alert(`Item "${data.title}" berhasil ditambahkan!`);
            onItemAdded(data); // Memberi tahu parent bahwa item baru telah ditambahkan
            onClose(); // Tutup modal
        } catch (err) {
            alert('Gagal menambah item: ' + err.message);
        }
    };
    
    // Reset form saat modal ditutup
    const handleClose = () => {
        setNewItemTitle('');
        if (editor) editor.commands.clearContent();
        setSelectedFolder('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Tambah Catatan Cepat</h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Pilih Folder Penyimpanan</label>
                            <select value={selectedFolder} onChange={e => setSelectedFolder(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required>
                                <option value="" disabled>-- Pilih Folder --</option>
                                {folders.map(folder => (<option key={folder.id} value={folder.id}>{folder.title}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Judul Catatan</label>
                            <input type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Konten</label>
                            <div className="border rounded-lg dark:border-gray-600">
                               {editor && <MenuBar editor={editor} />}
                               <EditorContent editor={editor} />
                            </div>
                        </div>
                        <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Simpan Catatan</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default QuickAddItemModal;
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';

function NoteViewPage() {
    const { id } = useParams(); // 'id' di sini adalah id dari note_item
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);
    const [parentFolder, setParentFolder] = useState(null); // Untuk link "kembali ke folder"

    const fetchItem = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Ambil detail item tunggal
            const { data: itemData, error: itemError } = await supabase
                .from('note_items')
                .select('*, notes(id, title)') // Ambil juga data parent folder-nya
                .eq('id', id)
                .single();

            if (itemError) throw itemError;
            
            setItem(itemData);
            if (itemData.notes) {
                setParentFolder(itemData.notes);
            }

        } catch (error) {
            alert("Gagal memuat catatan: " + error.message);
            setItem(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchItem();
    }, [id, fetchItem]);
    
    if (loading) return <div className="p-8 dark:text-gray-300 text-center">Memuat catatan...</div>;
    if (!item) return <div className="p-8 dark:text-gray-400 text-center">Catatan tidak ditemukan atau gagal dimuat.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            {parentFolder && (
                 <button 
                    onClick={() => navigate(`/note-collection/${parentFolder.id}`)} 
                    className="mb-6 text-sm text-blue-500 hover:underline"
                >
                    &larr; Kembali ke folder "{parentFolder.title}"
                </button>
            )}

            <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white break-words">
                    {item.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Dibuat: {new Date(item.created_at).toLocaleString()}
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
                <button 
                    onClick={() => navigate(`/note-collection/${parentFolder.id}`)} 
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Edit Catatan Ini
                </button>
            </div>
            
            <div 
                className="prose dark:prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
            />
        </div>
    );
}

export default NoteViewPage;
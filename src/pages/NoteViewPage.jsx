import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const CopyIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const CheckIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

function NoteViewPage({ session }) {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState(null);
    const [items, setItems] = useState([]);
    const [copiedSectionIndex, setCopiedSectionIndex] = useState(null);

    const fetchNoteData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [noteRes, itemsRes] = await Promise.all([
                supabase.from('notes').select('title, created_at, updated_at').eq('id', id).single(),
                supabase.from('note_items').select('*').eq('note_id', id).order('created_at', { ascending: true })
            ]);

            if (noteRes.error) throw noteRes.error;
            if (itemsRes.error) throw itemsRes.error;
            
            setNote(noteRes.data);
            setItems(itemsRes.data);
        } catch (error) {
            alert("Gagal memuat catatan: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNoteData();
    }, [id, fetchNoteData]);
    
    const convertHtmlToText = (html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    const handleCopySection = (htmlContent, index) => {
        const textToCopy = convertHtmlToText(htmlContent);
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedSectionIndex(index);
            setTimeout(() => setCopiedSectionIndex(null), 2000);
        }, (err) => {
            alert('Gagal menyalin bagian: ' + err);
        });
    };

    if (loading) return <div className="p-8 dark:text-gray-300">Memuat catatan...</div>;
    if (!note) return <div className="p-8 dark:text-gray-400">Catatan tidak ditemukan.</div>;

    return (
        <>
            <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white break-words">
                    {note.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Dibuat: {new Date(note.created_at).toLocaleString()}
                    {note.updated_at && ` | Terakhir diubah: ${new Date(note.updated_at).toLocaleString()}`}
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
                <Link 
                    to={`/note-collection/${id}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <EditIcon />
                    <span>Lihat/Edit di Koleksi</span>
                </Link>
            </div>
            
            <div className="space-y-8">
                {items && items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm overflow-hidden">
                        
                        <div className="flex justify-between items-center border-b dark:border-gray-600 px-4 sm:px-6 pt-4 pb-2">
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white break-words">
                                {item.title}
                            </h2>
                            <button 
                                onClick={() => handleCopySection(item.content, index)}
                                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                                title="Salin bagian ini"
                            >
                                {copiedSectionIndex === index ? (
                                    <CheckIcon className="h-5 w-5 text-green-500"/>
                                ) : (
                                    <CopyIcon className="h-5 w-5"/>
                                )}
                            </button>
                        </div>

                        <div
                            className="prose dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto overflow-x-auto px-4 sm:px-6 pb-4 pt-4 break-words"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                        />
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Belum ada konten di dalam catatan ini.</p>
                )}
            </div>
        </>
    );
}

export default NoteViewPage;
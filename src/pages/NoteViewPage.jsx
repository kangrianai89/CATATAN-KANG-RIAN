import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';
import useEditModalStore from '../stores/editModalStore.js';

// --- Komponen Ikon ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;


function NoteViewPage({ session }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);
    const [parentFolder, setParentFolder] = useState(null);
    const user = session?.user;

    const openEditModal = useEditModalStore((state) => state.openModal);
    const isEditModalOpen = useEditModalStore((state) => state.isOpen);

    const fetchItemData = useCallback(async () => {
        if (!id || !user) return;
        setLoading(true);
        setError(null);
        try {
            const { data: itemData, error: itemError } = await supabase
                .from('workspace_items')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();

            if (itemError) {
                if (itemError.code === 'PGRST116') throw new Error("Item tidak ditemukan.");
                throw itemError;
            }

            if (itemData.type !== 'note') {
                throw new Error("Item yang Anda coba buka bukanlah sebuah catatan.");
            }
            
            setItem(itemData);

            if (itemData.parent_id) {
                const { data: parentData, error: parentError } = await supabase
                    .from('workspace_items')
                    .select('id, title')
                    .eq('id', itemData.parent_id)
                    .single();
                
                if (parentError) console.warn("Gagal memuat folder induk:", parentError);
                setParentFolder(parentData);
            }

        } catch (err) {
            console.error("Gagal memuat catatan:", err);
            setError(err.message);
            setItem(null);
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (!isEditModalOpen) {
            fetchItemData();
        }
    }, [id, isEditModalOpen, fetchItemData]);
    
    if (loading) return <div className="p-8 dark:text-gray-300 text-center">Memuat catatan...</div>;
    if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;
    if (!item) return <div className="p-8 dark:text-gray-400 text-center">Catatan tidak ditemukan atau gagal dimuat.</div>;

    // --- LANGKAH DEBUGGING BARU ---
    // Kita akan melihat nilai 'content' tepat sebelum komponen di-render.
    console.log("Nilai KONTEN sesaat sebelum render:", item.content);
    // -----------------------------

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            {parentFolder ? (
                <Link 
                    to={`/note-collection/${parentFolder.id}`} 
                    className="mb-6 inline-flex items-center gap-2 text-sm text-blue-500 hover:underline"
                >
                    <BackIcon /> Kembali ke folder "{parentFolder.title}"
                </Link>
            ) : (
                 <Link 
                    to="/notes"
                    className="mb-6 inline-flex items-center gap-2 text-sm text-blue-500 hover:underline"
                >
                    <BackIcon /> Kembali ke Ruang Kerja
                </Link>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white break-words">
                            {item.title}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Dibuat: {new Date(item.created_at).toLocaleString()}
                        </p>
                    </div>
                    <button 
                        onClick={() => openEditModal(item.id)}
                        className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <EditIcon /> Edit
                    </button>
                </div>
                
                <hr className="my-6 dark:border-gray-700" />
                
                {/* --- PERBAIKAN: Mengaktifkan kembali DOMPurify --- */}
                <div 
                    className="prose dark:prose-invert max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content || '<p>Belum ada konten.</p>') }}
                />
            </div>
        </div>
    );
}

export default NoteViewPage;

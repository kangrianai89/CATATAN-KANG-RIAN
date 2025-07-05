import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import WebCollectionModal from '../components/WebCollectionModal';

// --- Komponen Ikon ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 11.5-11.5z"/></svg>;
const MoreVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;

function WebCollectionsPage({ session }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collections, setCollections] = useState([]);
    const [modalState, setModalState] = useState({ mode: 'closed', data: null });
    const [openMenuId, setOpenMenuId] = useState(null);
    const user = session?.user;
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (openMenuId && menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openMenuId]);

    useEffect(() => {
        async function fetchCollections() {
            if (!user?.id) { // Cek user.id langsung
                setError("User not authenticated.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('web_collections')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;
                setCollections(data || []);
            } catch (err) {
                setError("Gagal memuat koleksi: " + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCollections();
    // --- PERUBAHAN UTAMA ADA DI BARIS INI ---
    }, [user?.id]);

    const handleOpenModalForAdd = () => setModalState({ mode: 'add', data: null });
    const handleOpenModalForEdit = (collection) => {
        setModalState({ mode: 'edit', data: collection });
        setOpenMenuId(null);
    };
    const handleCloseModal = () => setModalState({ mode: 'closed', data: null });
    
    const handleDeleteCollection = async (collectionToDelete) => {
        setOpenMenuId(null);
        if (window.prompt(`Ketik 'HAPUS' untuk menghapus koleksi "${collectionToDelete.title}".`) === "HAPUS") {
            try {
                await supabase.from('web_collections').delete().eq('id', collectionToDelete.id);
                setCollections(prev => prev.filter(c => c.id !== collectionToDelete.id));
            } catch (err) {
                setError("Gagal menghapus koleksi: " + err.message);
            }
        }
    };

    const handleCollectionCreated = (newCollection) => {
        setCollections(prev => [newCollection, ...prev]);
    };

    const handleCollectionUpdated = (updatedCollection) => {
        setCollections(prev => prev.map(c => c.id === updatedCollection.id ? updatedCollection : c));
    };

    // ... sisa kode return JSX tetap sama ...
    if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold dark:text-white">Koleksi Web</h1>
                <button onClick={handleOpenModalForAdd} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors">
                    <PlusIcon /> Tambah Koleksi
                </button>
            </div>
            
            {collections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map(col => (
                        <div key={col.id} className="relative bg-white dark:bg-gray-800 shadow-lg rounded-lg group">
                            <Link to={`/web-collections/${col.id}`} className="block p-6">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-purple-600 transition-colors">
                                    {col.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-2 h-10 line-clamp-2">
                                    {col.description || 'Tidak ada deskripsi.'}
                                </p>
                            </Link>
                            <div className="absolute top-2 right-2">
                                <button onClick={() => setOpenMenuId(openMenuId === col.id ? null : col.id)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <MoreVerticalIcon />
                                </button>
                                {openMenuId === col.id && (
                                     <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border dark:border-gray-700">
                                        <ul className="py-1">
                                            <li>
                                                <button onClick={() => handleOpenModalForEdit(col)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <EditIcon /> Edit Detail
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => handleDeleteCollection(col)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <TrashIcon/> Hapus
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Anda Belum Punya Koleksi</h3>
                    <p className="mt-2 text-gray-500">Mulai buat koleksi baru untuk menyimpan link-link penting Anda.</p>
                </div>
            )}
            
            <WebCollectionModal
                isOpen={modalState.mode !== 'closed'}
                onClose={handleCloseModal}
                user={user}
                onCollectionCreated={handleCollectionCreated}
                onCollectionUpdated={handleCollectionUpdated}
                collectionToEdit={modalState.mode === 'edit' ? modalState.data : null}
            />
        </div>
    );
}

export default WebCollectionsPage;
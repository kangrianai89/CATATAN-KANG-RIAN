import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useEditModalStore from '../stores/editModalStore.js';
import useFolderEditModalStore from '../stores/folderEditModalStore.js'; // <-- Impor baru
import FolderManagementModal from '../components/FolderManagementModal';
import QuickAddItemModal from '../components/QuickAddItemModal';

// --- Ikon ---
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;


// --- Komponen Kartu Item yang Disederhanakan ---
// Menambahkan prop onEdit
const ItemCard = ({ item, onDelete, onEdit }) => {
    const destination = item.type === 'folder' ? `/note-collection/${item.id}` : `/note/${item.id}`;
    const Icon = item.type === 'folder' ? FolderIcon : FileIcon;

    const createSnippet = (htmlContent) => {
        if (!htmlContent) return "Tidak ada deskripsi...";
        const plainText = htmlContent.replace(/<[^>]*>?/gm, '');
        return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
    };

    return (
        <div className="flex justify-between items-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <Link to={destination} className="flex-grow min-w-0 flex items-center gap-3">
                <Icon />
                <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 truncate">{item.title}</h3>
                    {item.type === 'folder' ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                           {createSnippet(item.content)}
                        </p>
                    )}
                </div>
            </Link>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {/* Tombol Edit hanya muncul untuk folder */}
                {item.type === 'folder' && onEdit && (
                    <button onClick={() => onEdit(item)} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title="Ganti Nama">
                        <EditIcon />
                    </button>
                )}
                <button onClick={() => onDelete(item)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title="Hapus">
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};

// --- Komponen Halaman Detail Folder ---
function NoteCollectionDetailPage({ session }) {
    const { id } = useParams();
    const [currentItem, setCurrentItem] = useState(null);
    const [childItems, setChildItems] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const user = session?.user;

    const isEditModalOpen = useEditModalStore((state) => state.isOpen);
    // Mengambil aksi openModal dari store folder
    const openFolderEditModal = useFolderEditModalStore((state) => state.openModal);

    useEffect(() => {
        if (isEditModalOpen) return;

        async function fetchData() {
            if (!id || !user) return;
            setLoading(true);
            setError(null);
            
            try {
                const [currentRes, childrenRes, foldersRes] = await Promise.all([
                    supabase.from('workspace_items').select('*').eq('id', id).single(),
                    supabase.rpc('get_folder_contents_with_count', { p_parent_id: id }),
                    supabase.from('workspace_items').select('id, title').eq('type', 'folder')
                ]);

                if (currentRes.error) throw currentRes.error;
                if (childrenRes.error) throw childrenRes.error;
                if (foldersRes.error) throw foldersRes.error;

                setCurrentItem(currentRes.data);
                setChildItems(childrenRes.data || []);
                setAllFolders(foldersRes.data || []);

            } catch (err) {
                console.error(err);
                setError('Gagal memuat data. Folder mungkin tidak ada atau Anda tidak memiliki akses.');
                setCurrentItem(null);
                setChildItems([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, user, isEditModalOpen]);

    const handleItemCreated = () => {
        window.location.reload();
    };

    const handleDeleteItem = async (itemToDelete) => {
        const itemType = itemToDelete.type === 'folder' ? 'Folder' : 'Catatan';
        if (window.prompt(`Ketik 'HAPUS' untuk menghapus ${itemType} "${itemToDelete.title}". Ini akan menghapus semua isinya juga.`) === "HAPUS") {
            try {
                const { error } = await supabase.from('workspace_items').delete().eq('id', itemToDelete.id);
                if (error) throw error;
                setChildItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            } catch (err) {
                alert(`Gagal menghapus ${itemType}: ` + err.message);
            }
        }
    };

    if (loading) return <div className="p-6 text-center dark:text-gray-300">Memuat isi folder...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!currentItem) return <div className="p-6 text-center">Folder tidak ditemukan.</div>;

    const subFolders = childItems.filter(item => item.type === 'folder');
    const notes = childItems.filter(item => item.type === 'note');

    return (
        <>
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Link to="/notes" className="hover:underline">Ruang Kerja</Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{currentItem.title}</span>
                </nav>

                <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <h1 className="text-4xl font-bold dark:text-white">{currentItem.title}</h1>
                        <div className="flex gap-2">
                            <button onClick={() => setIsFolderModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600">
                                <FolderIcon /> Buat Folder
                            </button>
                            <button onClick={() => setIsNoteModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700">
                                <PlusIcon/> Buat Catatan
                            </button>
                        </div>
                    </div>
                </div>

                {subFolders.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 dark:text-white">Sub-folder</h2>
                        <div className="space-y-3">
                            {subFolders.map(item => (
                                <ItemCard key={item.id} item={item} onDelete={handleDeleteItem} onEdit={openFolderEditModal} />
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-2xl font-semibold mb-4 dark:text-white">Catatan</h2>
                    <div className="space-y-3">
                        {notes.length > 0 ? (
                            notes.map(item => (
                                <ItemCard key={item.id} item={item} onDelete={handleDeleteItem} />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <p>Folder ini belum memiliki catatan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FolderManagementModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                onFolderCreated={handleItemCreated}
                user={user}
                parentId={id}
            />

            <QuickAddItemModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onItemAdded={handleItemCreated}
                user={user}
                parentNoteId={id}
                folders={allFolders} 
            />
        </>
    );
}

export default NoteCollectionDetailPage;

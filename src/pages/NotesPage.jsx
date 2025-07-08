import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import FolderManagementModal from '../components/FolderManagementModal';
import useFolderEditModalStore from '../stores/folderEditModalStore'; // <-- Impor baru

// --- Ikon ---
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const MoreVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;


// --- Kartu Item (Folder) yang Diperbarui ---
const ItemCard = ({ item, onDelete, onEdit }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    const handleAction = (action) => {
        action();
        setIsMenuOpen(false);
    };

    const destination = `/note-collection/${item.id}`;

    return (
        <li className="group relative flex flex-col p-4 border rounded-lg shadow-sm transition-all bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-md hover:border-purple-500 dark:hover:border-purple-500">
            <Link to={destination} className="flex-grow min-w-0 w-full">
                <div className="flex items-center gap-3 mb-2">
                    <FolderIcon />
                    <h3 className="font-bold text-lg dark:text-white truncate group-hover:text-purple-600">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
                </p>
            </Link>
            
            <div ref={menuRef} className="absolute top-2 right-2">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity">
                    <MoreVerticalIcon />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border dark:border-gray-700">
                        <ul className="py-1">
                            {/* --- TES DIAGNOSTIK --- */}
                            <li className="px-4 py-2 text-xs text-yellow-400">DEBUG TEST</li>

                            {/* Tombol untuk Ganti Nama */}
                            <li>
                                <button 
                                    onClick={() => handleAction(() => onEdit(item))} 
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <EditIcon /> Ganti Nama
                                </button>
                            </li>
                            {/* Tombol Hapus */}
                            <li>
                                <button 
                                    onClick={() => handleAction(() => onDelete(item.id, item.title))} 
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <TrashIcon /> Hapus Folder
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </li>
    );
};

// --- Komponen Halaman Utama ---
function NotesPage({ session }) { 
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const user = session?.user;
    
    const openFolderEditModal = useFolderEditModalStore((state) => state.openModal);

    useEffect(() => {
        async function fetchTopLevelFolders() {
            if (!user?.id) { setLoading(false); return; }
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .rpc('get_top_level_folders_with_count');

                if (error) throw error;
                setItems(data || []);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchTopLevelFolders();
    }, [user?.id]);

    const handleDeleteItem = async (itemId, itemTitle) => { 
        if (window.prompt(`Ketik 'HAPUS' untuk menghapus folder "${itemTitle}" beserta seluruh isinya.`) === "HAPUS") {
            try {
                await supabase.from('workspace_items').delete().eq('id', itemId);
                setItems(items.filter((item) => item.id !== itemId));
            } catch (error) {
                alert("Gagal menghapus folder: " + error.message);
            }
        }
    };
    
    const handleFolderCreated = (newItem) => {
        const newItemWithCount = { ...newItem, item_count: 0 };
        setItems(prev => [newItemWithCount, ...prev].sort((a,b) => a.title.localeCompare(b.title)));
    };

    if (loading) return <div className="p-8 text-center dark:text-gray-300">Memuat Ruang Kerja...</div>;
    
    return (
    <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold dark:text-white">Ruang Kerja</h1>
                <p className="text-gray-600 dark:text-gray-400">Kelola semua folder dan catatan Anda di sini.</p>
            </div>
            <div className="flex flex-shrink-0">
                 <button 
                    onClick={() => setIsFolderModalOpen(true)} 
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors"
                 >
                    + Buat Folder
                </button>
            </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.length > 0 ? (
                items.map(item => (
                    <ItemCard 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDeleteItem} 
                        onEdit={openFolderEditModal}
                    />
                ))
            ) : (
                <div className="col-span-full text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Ruang Kerja Anda Kosong</h3>
                    <p className="mt-2 text-gray-500">Mulai buat folder pertama Anda.</p>
                </div>
            )}
        </ul>

        <FolderManagementModal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
            onFolderCreated={handleFolderCreated}
            user={user}
        />
    </div>
    );
}

export default NotesPage;

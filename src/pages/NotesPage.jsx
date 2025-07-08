import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import FolderManagementModal from '../components/FolderManagementModal';
import useFolderEditModalStore from '../stores/folderEditModalStore.js';

// --- Ikon ---
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;


// --- Komponen Item (Folder) dengan Tampilan Daftar ---
const FolderListItem = ({ item, onDelete, onEdit }) => {
    const destination = `/note-collection/${item.id}`;

    return (
        // PERUBAHAN: Menggunakan style list, bukan kartu
        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <Link to={destination} className="flex-grow min-w-0 flex items-center gap-3">
                <FolderIcon />
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
                    </p>
                </div>
            </Link>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <button onClick={() => onEdit(item)} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title="Ganti Nama">
                    <EditIcon />
                </button>
                <button onClick={() => onDelete(item.id, item.title)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" title="Hapus">
                    <TrashIcon />
                </button>
            </div>
        </div>
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold dark:text-white">Ruang Kerja</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola semua folder Anda di sini.</p>
            </div>
            <div className="flex-shrink-0 mt-4 sm:mt-0">
                 <button 
                    onClick={() => setIsFolderModalOpen(true)} 
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors w-full sm:w-auto"
                 >
                    + Buat Folder
                </button>
            </div>
        </div>

        {/* PERUBAHAN: Mengganti grid dengan container list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {items.length > 0 ? (
                items.map(item => (
                    <FolderListItem 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDeleteItem}
                        onEdit={openFolderEditModal}
                    />
                ))
            ) : (
                <div className="text-center text-gray-500 p-8">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Ruang Kerja Anda Kosong</h3>
                    <p className="mt-2">Mulai buat folder pertama Anda.</p>
                </div>
            )}
        </div>

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

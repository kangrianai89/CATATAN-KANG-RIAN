import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useEditModalStore from '../stores/editModalStore.js';
import useFolderEditModalStore from '../stores/folderEditModalStore.js';
import FolderManagementModal from '../components/FolderManagementModal';
import QuickAddItemModal from '../components/QuickAddItemModal';

// --- Ikon ---
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
const GenericFileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><path d="M10 10.5h4"/><path d="M10 14.5h4"/><path d="M12 18.5h-2"/></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;

const ItemCard = ({ item, onDelete, onEdit }) => {
    const isFolder = item.type === 'folder';
    const isNote = item.type === 'note';
    const isFile = item.type === 'file';

    const destination = isFolder ? `/note-collection/${item.id}` : `/note/${item.id}`;
    const Icon = isFolder ? FolderIcon : isNote ? NoteIcon : GenericFileIcon;

    const createSnippet = (htmlContent) => {
        if (!htmlContent) return "Tidak ada konten...";
        const plainText = htmlContent.replace(/<[^>]*>?/gm, '');
        return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
    };
    
    const handleDownload = async () => {
        try {
            const { data, error } = await supabase.storage.from('folder-files').download(item.content);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.title;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("Gagal mengunduh file: " + error.message);
        }
    };

    const MainContent = () => (
        <div className="flex items-start gap-3">
            <Icon className="flex-shrink-0 mt-1 text-gray-400" />
            <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-500 transition-colors">{item.title}</h3>
                {isFolder && <p className="text-sm text-gray-500 dark:text-gray-400">{item.item_count} {item.item_count === 1 ? 'item' : 'items'}</p>}
                {isNote && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{createSnippet(item.content)}</p>}
                {isFile && <p className="text-sm text-gray-500 dark:text-gray-400">Tipe: File</p>}
            </div>
        </div>
    );

    return (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            {isNote || isFolder ? (
                <Link to={destination} className="block group mb-2"><MainContent /></Link>
            ) : (
                <div className="block group mb-2"><MainContent /></div>
            )}
            <div className="flex justify-end items-center gap-2">
                {isFile && <button onClick={handleDownload} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Unduh</button>}
                {isFolder && onEdit && <button onClick={() => onEdit(item)} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 rounded-full" title="Ganti Nama"><EditIcon /></button>}
                <button onClick={() => onDelete(item)} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full" title="Hapus"><TrashIcon /></button>
            </div>
        </div>
    );
};


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
    
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    const isEditModalOpen = useEditModalStore((state) => state.isOpen);
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
    
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const filePath = `${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from('folder-files').upload(filePath, file);
            if (uploadError) throw uploadError;

            await supabase.from('workspace_items').insert({
                title: file.name, content: filePath, user_id: user.id,
                type: 'file', parent_id: id,
            });
            
            alert("File berhasil diunggah!");
            window.location.reload();

        } catch (error) {
            alert(`Gagal mengunggah file: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const handleDeleteItem = async (itemToDelete) => {
        const itemType = itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1);
        if (window.prompt(`Ketik 'HAPUS' untuk menghapus ${itemType} "${itemToDelete.title}".`) === "HAPUS") {
            try {
                if (itemToDelete.type === 'file') {
                    await supabase.storage.from('folder-files').remove([itemToDelete.content]);
                }
                await supabase.from('workspace_items').delete().eq('id', itemToDelete.id);
                handleItemCreated();
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
    const files = childItems.filter(item => item.type === 'file');

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
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
                            <button onClick={() => fileInputRef.current.click()} disabled={isUploading} title="Unggah File" className="p-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 disabled:bg-gray-400">
                                {isUploading ? "..." : <UploadIcon />}
                            </button>
                            <button onClick={() => setIsFolderModalOpen(true)} title="Buat Folder" className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600">
                                <FolderIcon />
                            </button>
                            {/* === PERUBAHAN ADA DI BARIS INI === */}
                            <button onClick={() => setIsNoteModalOpen(true)} title="Buat Catatan" className="p-2 bg-purple-600 text-white rounded-full shadow hover:bg-purple-700">
                                <NoteIcon/>
                            </button>
                        </div>
                    </div>
                </div>

                {subFolders.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-2 dark:text-white">Sub-folder</h2>
                        <div className="space-y-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            {subFolders.map(item => <ItemCard key={item.id} item={item} onDelete={handleDeleteItem} onEdit={openFolderEditModal} />)}
                        </div>
                    </div>
                )}
                
                {files.length > 0 && (
                     <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-2 dark:text-white">File</h2>
                        <div className="space-y-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            {files.map(item => <ItemCard key={item.id} item={item} onDelete={handleDeleteItem} />)}
                        </div>
                    </div>
                )}
                
                {notes.length > 0 && (
                     <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-2 dark:text-white">Catatan</h2>
                        <div className="space-y-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            {notes.map(item => <ItemCard key={item.id} item={item} onDelete={handleDeleteItem} />)}
                        </div>
                    </div>
                )}
                
                {childItems.length === 0 && (
                     <div className="text-center text-gray-500 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <p>Folder ini masih kosong.</p>
                    </div>
                )}
            </div>

            <FolderManagementModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onFolderCreated={handleItemCreated} user={user} parentId={id} />
            <QuickAddItemModal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} onItemAdded={handleItemCreated} user={user} parentNoteId={id} folders={allFolders} />
        </>
    );
}

export default NoteCollectionDetailPage;
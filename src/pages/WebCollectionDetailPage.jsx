import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- Komponen Ikon ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 18l-6-6 6-6"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

// --- Komponen Modal untuk Tambah Item ---
function AddItemModal({ isOpen, onClose, collectionId, user, onItemAdded }) {
    const [urlInput, setUrlInput] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [scrapedData, setScrapedData] = useState(null);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [error, setError] = useState(null);

    const handlePasteUrl = async (e) => {
        const pastedUrl = (e.clipboardData || window.clipboardData).getData('text');
        if (!pastedUrl) return; 

        if (pastedUrl.startsWith('http')) {
            e.preventDefault();
            setUrlInput(pastedUrl);
            setIsScraping(true);
            setScrapedData(null);
            setError(null);
            try {
                const { data, error: functionError } = await supabase.functions.invoke('scrape-metadata', { body: { url: pastedUrl } });
                if (functionError) throw new Error(functionError.message);
                if (data.error) throw new Error(data.error);
                setScrapedData(data);
                setNewItemTitle(data.title || '');
                setNewItemUrl(pastedUrl);
                setNewItemDescription(data.description || '');
            } catch (err) {
                setError("Gagal mengambil data dari URL. Silakan isi detail item secara manual.");
                setNewItemUrl(pastedUrl);
            } finally {
                setIsScraping(false);
            }
        } else {
            setNewItemUrl(pastedUrl);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItemTitle.trim() || !newItemUrl.trim()) return alert("Judul dan URL/Teks tidak boleh kosong!");
        try {
            const { data, error: insertError } = await supabase.from('web_items').insert({
                collection_id: collectionId, user_id: user.id, title: newItemTitle, url: newItemUrl,
                description: newItemDescription, image_url: scrapedData?.image || null,
            }).select().single();
            if (insertError) throw insertError;
            alert("Item baru berhasil ditambahkan!");
            onItemAdded(data);
            handleClose();
        } catch (err) {
            setError("Gagal menambahkan item: " + err.message);
        }
    };
    
    const handleClose = () => {
        setUrlInput(''); setIsScraping(false); setScrapedData(null);
        setNewItemTitle(''); setNewItemUrl(''); setNewItemDescription('');
        setError(null); onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Tambah Item Baru ke Koleksi</h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                     <input
                        type="text"
                        value={urlInput}
                        onPaste={handlePasteUrl}
                        onChange={(e) => { setUrlInput(e.target.value); setNewItemUrl(e.target.value); }}
                        placeholder="Tempelkan URL di sini atau ketik teks..."
                        className="w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-700 text-lg"
                        disabled={isScraping}
                    />
                    {isScraping && <div className="text-center py-4">Menganalisis link...</div>}
                    {error && !isScraping && <div className="text-red-500 text-sm p-3 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</div>}
                    {(newItemUrl || urlInput) && !isScraping && (
                        <form onSubmit={handleAddItem} className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-4 border dark:border-gray-700">
                            {scrapedData?.image && <img src={scrapedData.image} alt="Preview" className="w-full h-48 object-cover rounded-md bg-gray-200" />}
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul Item</label>
                                <input type="text" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} className="w-full p-2 border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">URL / Teks</label>
                                <input type="text" value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                                <textarea value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} rows="3" className="w-full p-2 border rounded-md"></textarea>
                            </div>
                            <button type="submit" className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md">Simpan Item</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- FUNGSI KOMPONEN UTAMA ---
function WebCollectionDetailPage({ session }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const user = session?.user;

    useEffect(() => {
        async function fetchData() {
            if (!user?.id || !id) return;
            setLoading(true);
            try {
                const [collectionRes, itemsRes] = await Promise.all([
                    supabase.from('web_collections').select(`*`).eq('id', id).eq('user_id', user.id).single(),
                    supabase.from('web_items').select('*').eq('collection_id', id).order('created_at', { ascending: false })
                ]);
                if (collectionRes.error) throw collectionRes.error;
                if (itemsRes.error) throw itemsRes.error;
                setCollection(collectionRes.data);
                setItems(itemsRes.data || []);
            } catch (err) {
                setError("Gagal memuat data: " + err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, user?.id]);

    const handleDeleteItem = async (itemToDelete) => {
        if (window.prompt(`Ketik 'HAPUS' untuk menghapus item "${itemToDelete.title}".`) === "HAPUS") {
            try {
                await supabase.from('web_items').delete().eq('id', itemToDelete.id);
                setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            } catch (err) {
                setError("Gagal menghapus item: " + err.message);
            }
        }
    };
    
    if (loading) return <div className="p-6 text-center dark:text-gray-300">Memuat...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!collection) return <div className="p-6 text-center text-gray-600">Koleksi tidak ditemukan.</div>;

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/web-collections')} className="mb-4 text-sm px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2">
                    <BackIcon /> Kembali
                </button>
                
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">{collection.title}</h1>
                            {collection.description && <p className="text-gray-600 dark:text-gray-400 mt-1">{collection.description}</p>}
                        </div>
                        <button onClick={() => setIsAddItemModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700">
                            <PlusIcon /> Tambah Item
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Daftar Item</h2>
                    {items.length > 0 ? (
                        <ul className="space-y-4">
                            {items.map(item => (
                                <li key={item.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex gap-4 items-start">
                                    {item.image_url && <img src={item.image_url} alt={item.title || ''} className="w-32 h-20 object-cover rounded flex-shrink-0 bg-gray-200" />}
                                    <div className="flex-grow">
                                        <a href={item.url && item.url.startsWith('http') ? item.url : `https://www.google.com/search?q=${encodeURIComponent(item.url)}`} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-500 hover:underline">{item.title}</a>
                                        {item.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>}
                                        {item.url && !item.url.startsWith('http') && <p className="text-xs text-gray-500 mt-1">Teks/Catatan: {item.url}</p>}
                                    </div>
                                    <button onClick={() => handleDeleteItem(item)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" title="Hapus Item">
                                        <TrashIcon />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-gray-500 py-8 bg-white dark:bg-gray-800 shadow rounded-lg">
                            <h3 className="text-lg font-semibold">Koleksi ini masih kosong</h3>
                            <p className="mt-1">Mulai tambahkan item dengan menekan tombol 'Tambah Item' di atas.</p>
                        </div>
                    )}
                </div>
            </div>

            <AddItemModal 
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                collectionId={id}
                user={user}
                onItemAdded={(newItem) => setItems(prev => [newItem, ...prev])}
            />
        </div>
    );
}


// --- FUNGSI 'PENJAGA PINTU' UNTUK MENCEGAH RENDER ULANG ---
function propsAreEqual(prevProps, nextProps) {
  // Fungsi ini memberitahu React untuk HANYA render ulang jika ID user berubah.
  // Perubahan pada seluruh objek 'session' yang referensinya baru tapi isinya sama akan diabaikan.
  return prevProps.session?.user?.id === nextProps.session?.user?.id;
}


// --- EXPORT DENGAN 'PELINDUNG' REACT.MEMO ---
// Ini adalah baris kunci yang akan menyelesaikan masalah refresh otomatis.
export default React.memo(WebCollectionDetailPage, propsAreEqual);
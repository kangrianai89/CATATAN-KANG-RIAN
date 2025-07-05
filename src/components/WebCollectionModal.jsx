import { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function WebCollectionModal({ isOpen, onClose, categories, user, onCollectionCreated, onCategoryCreated }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('addCollection');
    
    // State untuk form "Tambah Koleksi"
    const [newCollectionTitle, setNewCollectionTitle] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');

    // State untuk form "Kelola Kategori"
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedParentCategory, setSelectedParentCategory] = useState('');

    const parentCategories = useMemo(() => categories.filter(cat => !cat.parent_id).sort((a,b) => a.name.localeCompare(b.name)), [categories]);
    const subCategoriesByParent = useMemo(() => {
        const grouped = {};
        parentCategories.forEach(pCat => {
            grouped[pCat.id] = categories.filter(cat => cat.parent_id === pCat.id).sort((a,b) => a.name.localeCompare(b.name));
        });
        return grouped;
    }, [categories, parentCategories]);

    const handleAddCollection = async (e) => {
        e.preventDefault();
        if (!newCollectionTitle || !selectedSubCategory) {
            alert("Judul dan Sub-Kategori koleksi tidak boleh kosong!");
            return;
        }
        try {
            const { data, error } = await supabase.from('web_collections').insert({
                user_id: user.id,
                title: newCollectionTitle,
                category_id: selectedSubCategory
            }).select('id').single();
            
            if (error) throw error;
            alert('Koleksi web berhasil ditambahkan!');
            onClose();
            navigate(`/web-collections/${data.id}`);
        } catch (err) {
            alert("Gagal menambahkan koleksi: " + err.message);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName) {
            alert("Nama Kategori harus diisi!");
            return;
        }
        try {
            const newCategory = { name: newCategoryName, user_id: user.id };
            if (selectedParentCategory) {
                newCategory.parent_id = selectedParentCategory;
            }
            const { data, error } = await supabase.from('web_categories').insert(newCategory).select().single();
            if (error) throw error;
            onCategoryCreated(data);
            setNewCategoryName('');
            setSelectedParentCategory('');
            alert('Kategori berhasil dibuat!');
        } catch (error) {
             alert("Gagal membuat kategori: " + error.message);
        }
    };

    const handleClose = () => {
        setNewCollectionTitle('');
        setSelectedSubCategory('');
        setNewCategoryName('');
        setSelectedParentCategory('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold dark:text-white">Manajemen Koleksi</h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&times;</button>
                </div>

                <div className="flex border-b dark:border-gray-700 flex-shrink-0">
                    <button onClick={() => setActiveTab('addCollection')} className={`flex-1 py-3 px-4 font-semibold ${activeTab === 'addCollection' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                        Tambah Koleksi Baru
                    </button>
                    <button onClick={() => setActiveTab('manageCategory')} className={`flex-1 py-3 px-4 font-semibold ${activeTab === 'manageCategory' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                        Kelola Kategori
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'addCollection' && (
                        <form onSubmit={handleAddCollection} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul Koleksi</label>
                                <input type="text" value={newCollectionTitle} onChange={e => setNewCollectionTitle(e.target.value)} placeholder="Misal: Tutorial React Terbaik" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Pilih Sub-Kategori</label>
                                <select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" required>
                                    <option value="" disabled>-- Pilih --</option>
                                    {parentCategories.map(pCat => (
                                        <optgroup key={pCat.id} label={pCat.name}>
                                            {(subCategoriesByParent[pCat.id] || []).map(sCat => (<option key={sCat.id} value={sCat.id}>{sCat.name}</option>))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md">Tambah Koleksi</button>
                        </form>
                    )}

                    {activeTab === 'manageCategory' && (
                         <form onSubmit={handleCreateCategory} className="space-y-4">
                            <h3 className="text-lg font-semibold">Buat Kategori Baru</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama Kategori</label>
                                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">Jadikan Sub-Kategori dari (Opsional)</label>
                                <select value={selectedParentCategory} onChange={e => setSelectedParentCategory(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                                    <option value="">-- Jadikan Kategori Induk --</option>
                                    {parentCategories.map(pCat => (
                                        <option key={pCat.id} value={pCat.id}>{pCat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Simpan Kategori Baru</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WebCollectionModal;
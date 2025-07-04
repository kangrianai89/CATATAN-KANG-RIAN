import { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';

function NoteManagementModal({ isOpen, onClose, categories, onFolderCreated, onCategoryCreated, user }) {
    const [activeTab, setActiveTab] = useState('addFolder');
    
    // State untuk form "Buat Folder"
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [newFolderDesc, setNewFolderDesc] = useState('');
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

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderTitle || !selectedSubCategory) {
            alert("Judul Folder dan Sub-Kategori harus diisi!");
            return;
        }
        try {
            const { data, error } = await supabase.from('notes').insert({ 
                title: newFolderTitle,
                description: newFolderDesc,
                user_id: user.id,
                category_id: selectedSubCategory,
                pinned: false
            }).select().single();
            
            if (error) throw error;
            
            onFolderCreated(data); // Kirim data folder baru ke parent component
            setNewFolderTitle('');
            setNewFolderDesc('');
            setSelectedSubCategory('');
            alert('Folder Catatan berhasil dibuat!');
            onClose(); // Tutup modal setelah berhasil
        } catch (error) {
            alert("Gagal membuat folder: " + error.message);
        }
    };
    
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName) {
            alert("Nama Kategori harus diisi!");
            return;
        }
        
        try {
            const newCategory = { name: newCategoryName };
            if (selectedParentCategory) {
                newCategory.parent_id = selectedParentCategory;
            }

            const { data, error } = await supabase.from('categories').insert(newCategory).select().single();

            if (error) throw error;

            onCategoryCreated(data); // Kirim data kategori baru ke parent
            setNewCategoryName('');
            setSelectedParentCategory('');
            alert('Kategori berhasil dibuat!');

        } catch (error) {
             alert("Gagal membuat kategori: " + error.message);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold dark:text-white">Manajemen Catatan</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&times;</button>
                </div>

                <div className="flex border-b dark:border-gray-700 flex-shrink-0">
                    <button onClick={() => setActiveTab('addFolder')} className={`flex-1 py-3 px-4 font-semibold ${activeTab === 'addFolder' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                        Buat Folder Baru
                    </button>
                    <button onClick={() => setActiveTab('manageCategory')} className={`flex-1 py-3 px-4 font-semibold ${activeTab === 'manageCategory' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                        Kelola Kategori
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'addFolder' && (
                        <form onSubmit={handleCreateFolder} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul Folder</label>
                                <input type="text" value={newFolderTitle} onChange={e => setNewFolderTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                                <input type="text" value={newFolderDesc} onChange={e => setNewFolderDesc(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Masukkan ke Sub-Kategori</label>
                                <select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required>
                                    <option value="" disabled>-- Pilih Sub-Kategori --</option>
                                    {parentCategories.map(pCat => (
                                        <optgroup key={pCat.id} label={pCat.name}>
                                            {(subCategoriesByParent[pCat.id] || []).map(sCat => (<option key={sCat.id} value={sCat.id}>{sCat.name}</option>))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700">Simpan Folder Baru</button>
                        </form>
                    )}

                    {activeTab === 'manageCategory' && (
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <h3 className="text-lg font-semibold">Buat Kategori Baru</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama Kategori</label>
                                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">Jadikan Sub-Kategori dari (Opsional)</label>
                                <select value={selectedParentCategory} onChange={e => setSelectedParentCategory(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">-- Jadikan Kategori Induk --</option>
                                    {parentCategories.map(pCat => (
                                        <option key={pCat.id} value={pCat.id}>{pCat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Simpan Kategori Baru</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NoteManagementModal;
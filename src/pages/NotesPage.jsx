import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useParams } from 'react-router-dom';

const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
const PinIcon = ({ isPinned }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> );

// Nama fungsi diubah menjadi NotesPage agar sesuai dengan nama file
function NotesPage({ session }) { 
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNotes(categoryId, searchTerm);
  }, [categoryId, searchTerm]);

  const fetchNotes = async (currentCategoryId, currentSearchTerm) => {
    setLoadingNotes(true);
    try {
      let query = supabase
        .from('notes')
        .select(`id, title, created_at, pinned, categories ( id, name )`)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (currentCategoryId) {
        query = query.eq('category_id', currentCategoryId);
      }
      if (currentSearchTerm) {
        query = query.ilike('title', `%${currentSearchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setNotes(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name').order('name', { ascending: true });
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      alert(error.message);
    }
  };
  
  const handleCreateNewNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('notes').insert({ 
        title: 'Catatan Baru',
        user_id: user.id, 
        sections: [{ title: 'Bagian Pertama', content: '' }] 
      }).select().single();
      if (error) throw error;
      navigate(`/note/${data.id}/edit`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus catatan ini?")) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', noteId);
        if (error) throw error;
        setNotes(notes.filter((note) => note.id !== noteId));
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleTogglePin = async (noteId, currentStatus) => {
    try {
        await supabase.from('notes').update({ pinned: !currentStatus }).eq('id', noteId);
        fetchNotes(categoryId, searchTerm);
    } catch (error) {
      alert('Gagal memperbarui pin: ' + error.message);
    }
  };

  // Fungsi logout tidak diperlukan di sini lagi karena sudah ada di DashboardPage
  // const handleLogout = async () => { ... };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Manajemen Catatan</h1>
          <p className="text-gray-600 dark:text-gray-400">Semua catatan Anda ada di sini.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCreateNewNote} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
            <PlusIcon />
            <span>Buat Catatan Baru</span>
          </button>
        </div>
      </div>
      
      <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-3 dark:text-white">Filter & Pencarian</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari catatan berdasarkan judul..."
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <h3 className="font-medium mb-2 dark:text-white">Filter Kategori:</h3>
          <div className="flex flex-wrap gap-2">
            {/* --- PERBAIKAN LINK DI SINI --- */}
            <Link 
              to="/notes" 
              className={`px-3 py-1 text-sm rounded-full transition-colors ${!categoryId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
            >
              Semua Kategori
            </Link>
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/notes/category/${cat.id}`} 
                className={`px-3 py-1 text-sm rounded-full transition-colors ${categoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 dark:text-white">Catatan Anda {categoryId && `di Kategori: ${categories.find(c => c.id === categoryId)?.name || '...'}`}</h2>
        {loadingNotes ? <p className="dark:text-gray-400">Memuat catatan...</p> : notes.length === 0 ? <p className="dark:text-gray-400">Tidak ada catatan.</p> : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li key={note.id} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${note.pinned ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
                <Link to={`/note/${note.id}`} className="flex-grow min-w-0 mr-0 sm:mr-4 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    {note.pinned && <PinIcon isPinned={true} />}
                    <h3 className="font-bold text-lg dark:text-white truncate">{note.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {note.categories && (
                      <span className="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">{note.categories.name}</span>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dibuat pada: {new Date(note.created_at).toLocaleDateString()}</p>
                  </div>
                </Link>
                <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                  <button onClick={() => handleTogglePin(note.id, note.pinned)} title={note.pinned ? 'Lepas Sematan' : 'Sematkan Catatan'} className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 ${ note.pinned ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500' }`}><PinIcon isPinned={note.pinned} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200">Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// Ubah nama export default agar sesuai
export default NotesPage;
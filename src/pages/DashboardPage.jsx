import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const PinIcon = ({ isPinned }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);

function DashboardPage({ session }) {
  const navigate = useNavigate();
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [selectedCategoryFilter]);

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      let query = supabase
        .from('notes')
        .select(`id, title, created_at, pinned, categories ( id, name )`)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (selectedCategoryFilter) {
        query = query.eq('category_id', selectedCategoryFilter);
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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('categories').insert({ name: newCategoryName, user_id: user.id }).select().single();
      if (error) throw error;
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
    } catch (error) {
      alert(error.message);
    }
  };
  
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('notes').insert({ title: newNoteTitle, user_id: user.id, sections: [{ title: 'Bagian Pertama', content: '' }] }).select().single();
      if (error) throw error;
      navigate(`/note/${data.id}`);
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
        const { data, error } = await supabase.from('notes').update({ pinned: !currentStatus }).eq('id', noteId).select().single();
        if (error) throw error;
        fetchNotes();
    } catch (error) {
        alert('Gagal memperbarui pin: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      {/* BAGIAN HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Dashboard Catatan</h1>
          <p className="text-gray-600 dark:text-gray-400">Login sebagai: {session.user.email}</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 w-full sm:w-auto">Logout</button>
      </div>
      
      {/* BAGIAN FORM BUAT CATATAN */}
      <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <form onSubmit={handleCreateNote}>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Buat Catatan Baru</h2>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input type="text" placeholder="Judul Catatan..." className="w-full flex-grow px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} required/>
            <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Buat & Edit</button>
          </div>
        </form>
      </div>
      
      {/* BAGIAN DAFTAR CATATAN */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold dark:text-white">Catatan Anda</h2>
        </div>
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
                  <button onClick={() => handleTogglePin(note.id, note.pinned)} title={note.pinned ? 'Lepas Sematan' : 'Sematkan Catatan'} className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 ${ note.pinned ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500' }`}>
                      <PinIcon isPinned={note.pinned} />
                  </button>
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

export default DashboardPage;
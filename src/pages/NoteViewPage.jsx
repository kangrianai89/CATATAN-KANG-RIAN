import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';

// Komponen ikon untuk tombol Edit
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

function NoteViewPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);

  const fetchNote = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('title, sections, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      setNote(data);
    } catch (error)      alert("Gagal memuat catatan: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNote();
  }, [id, fetchNote]);

  if (loading) return <div className="p-8 dark:text-gray-300">Memuat catatan...</div>;
  if (!note) return <div className="p-8 dark:text-gray-300">Catatan tidak ditemukan.</div>;

  return (
    <>
      {/* --- PERUBAHAN UTAMA DI BAGIAN INI --- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div className="flex-grow">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white break-words">
            {note.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Dibuat: {new Date(note.created_at).toLocaleString()}
            {note.updated_at && ` | Terakhir diubah: ${new Date(note.updated_at).toLocaleString()}`}
          </p>
        </div>
        <Link 
            to={`/note/${id}/edit`} 
            className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
        >
            <EditIcon />
            <span>Edit Catatan</span>
        </Link>
      </div>

      <div className="space-y-8">
        {note.sections && note.sections.map((section, index) => (
          <div key={index} className="p-6 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">
              {section.title}
            </h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content) }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default NoteViewPage;
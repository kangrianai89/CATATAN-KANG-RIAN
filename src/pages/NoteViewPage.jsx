import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function NoteViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('title, sections')
          .eq('id', id)
          .single();
        if (error) throw error;
        setNote(data);
      } catch (error) {
        alert("Gagal memuat catatan: " + error.message);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id, navigate]);

  if (loading) return <div className="p-8 dark:text-gray-300">Memuat catatan...</div>;
  if (!note) return <div className="p-8 dark:text-gray-300">Catatan tidak ditemukan.</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold dark:text-white break-words">{note.title}</h1>
        <div className="flex gap-2 flex-shrink-0">
            <Link to="/dashboard" className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                &larr; Kembali
            </Link>
            <Link to={`/note/edit/${id}`} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Edit Catatan
            </Link>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        {note.sections && note.sections.length > 0 ? note.sections.map((section, index) => (
          <div key={index} className="break-words">
            <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-600">{section.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </div>
        )) : (
            <p>Catatan ini belum memiliki isi.</p>
        )}
      </div>
    </>
  );
}

export default NoteViewPage;
// File: src/pages/ChatPage.jsx

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Komponen untuk setiap balon pesan chat
const ChatBubble = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} mb-4`}>
            <div className={`max-w-xl px-4 py-3 rounded-2xl shadow ${isModel ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-purple-600 text-white'}`}>
                <p>{message.parts[0].text}</p>
            </div>
        </div>
    );
};


function ChatPage({ session }) {
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: 'Hai! Saya adalah asisten AI Anda. Ada yang bisa saya bantu hari ini?' }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Fungsi untuk auto-scroll ke pesan terbaru
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', parts: [{ text: input.trim() }] };
        const newMessages = [...messages, userMessage];
        
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Memformat riwayat untuk dikirim ke model Gemini
            const history = newMessages.slice(0, -1); // Ambil semua pesan kecuali yang terakhir (pesan user saat ini)
            
            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: { 
                    prompt: input.trim(),
                    history: history 
                },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
            const aiMessage = { role: 'model', parts: [{ text: data.response }] };
            setMessages(prev => [...prev, aiMessage]);

        } catch (err) {
            const errorMessage = { role: 'model', parts: [{ text: "Maaf, terjadi kesalahan: " + err.message }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto p-4">
            <h1 className="text-3xl font-bold dark:text-white mb-4 text-center">Asisten AI</h1>
            
            {/* Area Pesan */}
            <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isLoading && (
                     <div className="flex justify-start mb-4">
                        <div className="max-w-xl px-4 py-3 rounded-2xl shadow bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                           <p className="animate-pulse">AI sedang mengetik...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Area Input */}
            <div className="mt-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ketik pesan Anda di sini..."
                        className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 disabled:bg-purple-400"
                        disabled={isLoading}
                    >
                        Kirim
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatPage;
// src/components/MenuBar.jsx

import React from 'react';

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const buttonClass = "px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50";

    return (
        <div className="p-2 border-b dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex flex-wrap gap-2 tiptap">
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}>H1</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}>H2</button>
            <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={`${buttonClass} ${editor.isActive('paragraph') ? 'is-active' : ''}`}>Paragraf</button>
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${buttonClass} ${editor.isActive('bold') ? 'is-active' : ''}`}>Bold</button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${buttonClass} ${editor.isActive('italic') ? 'is-active' : ''}`}>Italic</button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${buttonClass} ${editor.isActive('strike') ? 'is-active' : ''}`}>Strike</button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${buttonClass} ${editor.isActive('bulletList') ? 'is-active' : ''}`}>List</button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${buttonClass} ${editor.isActive('orderedList') ? 'is-active' : ''}`}>List Angka</button>
            <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${buttonClass} ${editor.isActive('codeBlock') ? 'is-active' : ''}`}>Code Block</button>
        </div>
    );
};

export default MenuBar;
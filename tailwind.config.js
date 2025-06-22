// 1. Impor plugin dengan sintaks 'import'
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // 2. Gunakan variabel yang sudah diimpor (bukan 'require')
  plugins: [
    typography,
  ],
}
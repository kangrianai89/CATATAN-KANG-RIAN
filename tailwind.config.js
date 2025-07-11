// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Pastikan dark mode diatur ke 'class'
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // === BAGIAN YANG DITAMBAHKAN/DIUBAH ===
      fontFamily: {
        // Daftarkan font 'Lora' agar bisa dipanggil via class 'font-lora'
        'lora': ['"Lora"', 'serif'], 
      }
      // ===================================
    },
  },
  plugins: [
    // Pastikan plugin typography ada (karena kita menggunakan class 'prose')
    require('@tailwindcss/typography'),
  ],
}
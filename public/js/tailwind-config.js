// Warna palet Logos LAB (docs/DESIGN_SYSTEM.md §02) untuk Tailwind CDN.
// Dimuat tepat setelah script cdn.tailwindcss.com. Pakai nama warna di class: bg-primary, text-accent, border-highlight.
tailwind.config = {
  ...(tailwind.config || {}),
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1A237E', dark: '#121858' },
        accent: { DEFAULT: '#FF5722', hover: '#E64A19' },
        highlight: '#FFC107',
        success: '#16A34A',
        error: '#DC2626',
        muted: '#64748B',
      },
    },
  },
};

### 🎯 Objective
Melakukan audit dan revisi total pada sistem tipografi Logos Lab menggunakan Tailwind CSS untuk meningkatkan keterbacaan (readability), estetika, dan responsivitas perangkat (fluid typography).

---

### 🛠 Tech Stack Consistency
- **Framework:** Bun + ElysiaJS
- **Styling:** Tailwind CSS (Fluid scale via responsive utilities)
- **Typography:** Outfit (Heading & Body) - *Tetap konsisten dengan font yang sudah ada namun perbaiki ukurannya.*

---

### 📏 Aturan Skala Tipografi Baru (Wajib Diikuti)

| Elemen | Desktop (md+) | Mobile (sm) | Font Weight | Utilities Tambahan |
| :--- | :--- | :--- | :--- | :--- |
| **Heading Utama** | `text-2xl` | `text-xl` | `font-bold` | `tracking-tight`, `leading-tight` |
| **Sub-heading / Card Title** | `text-lg` | `text-base` | `font-semibold` | `tracking-normal` |
| **Body Text (Konten)** | `text-base` | `text-sm` | `font-normal/medium` | `leading-relaxed` |
| **Table Header / Metadata** | `text-sm` | `text-xs` | `font-medium` | `uppercase`, `tracking-wider` |
| **Sidebar Navigation** | `text-sm` | `text-sm` | `font-semibold` | `uppercase`, `tracking-wide` |

---

### 📂 Daftar File yang Perlu Direvisi

1. **`src/views/layouts/Layout.tsx`**
   - Revisi `h1` pada Main Header.
   - Revisi teks notifikasi dan profile metadata.
   - Tambahkan `leading-relaxed` pada kontainer utama jika diperlukan.

2. **`src/views/components/Sidebar.tsx`**
   - Ubah `text-xs` pada menu items menjadi `text-sm`.
   - Pastikan teks ringkas agar tidak memenuhi layar tablet.

3. **`src/views/components/KetuaTimDashboard.tsx`** (dan Dashboard lainnya)
   - Revisi Heading Dashboard (`text-2xl`).
   - Standarisasi Tabel: `thead` menggunakan `text-xs md:text-sm`, `tbody` menggunakan `text-sm md:text-base`.
   - Revisi Card Title pada List View.
   - Revisi teks dalam modal Create/Edit (Labels & Help Text).

4. **`src/views/pages/EditProfile.tsx`**
   - Revisi label form dan instruksi.

---

### 💡 Contoh Perbaikan Class Tailwind

#### 1. Main Dashboard Header
**Sebelum:**
```html
<h2 class="text-2xl font-extrabold text-white tracking-tight">Manajemen Proyek Game</h2>
```
**Sesudah (Revised):**
```html
<h2 class="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">Manajemen Proyek Game</h2>
```

#### 2. Table Component
**Sebelum:**
```html
<tr class="border-b border-slate-100 text-slate-400 text-sm">
  <th class="pb-4 font-semibold">ID</th>
  <th class="pb-4 font-semibold text-right">Aksi</th>
</tr>
<div class="font-bold text-slate-800 text-lg" x-text="p.title"></div>
```
**Sesudah (Revised):**
```html
<tr class="border-b border-slate-100 text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
  <th class="pb-4 pt-4 px-6">ID</th>
  <th class="pb-4 pt-4 px-6 text-right">AKSI</th>
</tr>
<div class="font-semibold text-slate-800 text-base md:text-lg leading-tight" x-text="p.title"></div>
```

---

### ⚠️ Anti-Regression & Stability
- **Dilarang Ubah:** Logic Alpine.js (x-data, x-on, x-model), RBAC System, Database Config, dan Flow API.
- **Visual Check:** Pastikan padding (`p-x`, `m-x`) tetap konsisten agar layout tidak hancur saat ukuran font berubah.

---

### ✅ Readiness Confirmation
Rencana audit tipografi ini telah matang secara arsitektural. Low Agent dapat mengeksekusi perubahan file demi file mulai dari Layout kemudian ke komponen Dashboard.

**PENTING:** Gunakan unit `rem` (default Tailwind) untuk mendukung aksesibilitas browser pengguna.

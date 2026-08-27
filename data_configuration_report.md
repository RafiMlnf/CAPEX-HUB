# Laporan Lengkap Konfigurasi Master Data & Tata Kelola Sistem Portal Terpadu (CAPEX, BODR & Otorisasi Harga)
**PT Menara Terus Makmur (Astra Otoparts Group)**  
*Dokumen Referensi Tata Kelola Sistem, Hak Akses Pengguna, dan Alur Persetujuan (Workflow Engine)*

---

## Ringkasan Eksekutif (Executive Summary)

Sistem Portal Terpadu PT Menara Terus Makmur dirancang untuk mengintegrasikan 3 (tiga) pilar modul operasional dan investasi belanja modal:
1. **Portal CAPEX (Feasibility Study & Gate Process)**: Pengelolaan usulan investasi belanja modal (Gate 0 s/d Gate 6), evaluasi kelayakan finansial, dan pengesahan oleh Sidang Komite Investasi (*Investment Committee*).
2. **Portal BODR (Budget Owner Disbursement Request)**: Resolusi eksekusi pencairan anggaran per departemen dengan verifikasi bertingkat (*multi-step hierarchy*).
3. **Portal Otorisasi Harga (Purchasing Price Authorization)**: Penetapan dan otorisasi harga material produksi (*product*) maupun non-produksi (*tools, spare parts, jasa*) bersama vendor rekanan.

Laporan ini menyajikan konfigurasi baku seluruh **Master Data** dan **Pengaturan Sistem (Settings)** secara terperinci.

---

## 1. Master Data: Departemen
Tabel referensi departemen aktif di perusahaan yang menjadi induk penempatan user, alokasi pos anggaran CAPEX, dan alur persetujuan.

| No | Kode Dept | Nama Departemen | Fungsi & Tanggung Jawab Operasional | Status |
|:---:|:---:|:---|:---|:---:|
| 1 | `IT` | Information Technology | Pengelolaan infrastruktur, jaringan, server & sistem aplikasi | `active` |
| 2 | `FIN` | Finance & Accounting | Pengelolaan kas, verifikasi anggaran, perpajakan & pembukuan | `active` |
| 3 | `PUR` | Purchasing / Procurement | Pengadaan barang/jasa, negosiasi harga & evaluasi vendor | `active` |
| 4 | `ENG` | Engineering | Rekayasa teknologi mesin, modifikasi lini & fasilitas pabrik | `active` |
| 5 | `OMD` | Operation Management | Manajemen operasional, perencanaan kapasitas & efisiensi pabrik | `active` |
| 6 | `PROD` | Production | Pelaksanaan operasional proses produksi manufaktur | `active` |
| 7 | `QA` | Quality Assurance | Pengendalian standar mutu, inspeksi & sertifikasi produk | `active` |
| 8 | `HRGA` | Human Resources & General Affair | Personalia, hubungan industrial, K3L & fasilitas umum | `active` |

---

## 2. Master Data: Roles (Peran Hierarki Pengguna)
Tabel peran/jabatan yang menentukan wewenang hierarki persetujuan (*approval authority*) serta batas tanggung jawab dalam alur bisnis.

| No | Kode Role | Nama Role | Deskripsi Wewenang & Tanggung Jawab | Status |
|:---:|:---:|:---|:---|:---:|
| 1 | `Admin` | Administrator | Akses penuh konfigurasi master data, user & sistem | `active` |
| 2 | `Proposer` | Proposer / Pemohon | Menginisiasi draft usulan CAPEX (Gate 0), proposal BODR & form OH | `active` |
| 3 | `Head Dept` | Head of Department | Meninjau & menyetujui tahap pertama usulan departemen | `active` |
| 4 | `Accounting` | Accounting Officer | Verifikasi pos akun anggaran, depresiasi & alokasi cost center | `active` |
| 5 | `Finance` | Finance Reviewer | Review kelayakan finansial, payback period, NPV/IRR CAPEX (Gate 1) | `active` |
| 6 | `Komite CAPEX` | Investment Committee | Tim penilai sidang kelayakan investasi strategis CAPEX (Gate 2) | `active` |
| 7 | `Purchasing` | Purchasing Buyer | Negosiasi harga vendor & penerbitan dokumen Otorisasi Harga | `active` |
| 8 | `DIV ENG` | Division Head Engineering | Otorisasi aspek teknis rekayasa mesin & fasilitas pabrik | `active` |
| 9 | `DEPUTY PLAN` | Deputy Plant Manager | Perencanaan strategis plant & keselarasan utilisasi kapasitas | `active` |
| 10 | `DIR` | Director | Direktur penyetuju final investasi, anggaran & harga | `active` |
| 11 | `PRESDIR` | President Director | Pimpinan tertinggi pengambil keputusan investasi bernilai besar | `active` |

---

## 3. Master Data: Permission (Katalog Hak Akses Sistem)
Katalog izin spesifik untuk setiap fungsi operasional sistem di seluruh modul CAPEX, BODR, Otorisasi Harga, dan Administrasi.

| No | Kode Permission | Nama Permission | Modul Terkait | Deskripsi Hak Akses Operasional | Status |
|:---:|:---|:---|:---:|:---|:---:|
| 1 | `perm_create_capex` | Buat Usulan CAPEX | **CAPEX** | Membuat & mengajukan draft usulan investasi belanja modal (Gate 0: Idea Submission) | `active` |
| 2 | `perm_review_capex` | Review Feasibility CAPEX | **CAPEX** | Melakukan analisis kelayakan finansial, ROI, NPV & verifikasi teknis (Gate 1: Finance Review) | `active` |
| 3 | `perm_committee_review` | Sidang Komite CAPEX | **CAPEX** | Menilai, merevisi, atau menyetujui usulan investasi dalam sidang komite (Gate 2: Committee Review) | `active` |
| 4 | `perm_closing_capex` | Closing & Evaluasi CAPEX | **CAPEX** | Mengesahkan penyelesaian proyek, uji komisioning & realisasi manfaat investasi (Gate 3 - 6) | `active` |
| 5 | `perm_create_bodr` | Buat Pengajuan BODR | **BODR** | Membuat & menyimpan draft formulir pengajuan pencairan anggaran BODR | `active` |
| 6 | `perm_approve_bodr` | Approve Alur BODR | **BODR** | Menyetujui, merevisi, atau menolak langkah persetujuan bertingkat pada alur BODR | `active` |
| 7 | `perm_create_price` | Buat Otorisasi Harga | **Otorisasi Harga** | Mengajukan dokumen penetapan harga vendor untuk komponen Product / Non-Product | `active` |
| 8 | `perm_approve_price`| Approve Otorisasi Harga | **Otorisasi Harga** | Menyetujui / merevisi jenjang persetujuan otorisasi harga purchasing | `active` |
| 9 | `perm_sync_bodr` | Sinkronisasi Data BODR | **Integrasi** | Memicu sinkronisasi data realisasi anggaran antara BODR, CAPEX, dan Otorisasi Harga | `active` |
| 10 | `perm_view_dashboard`| Monitor Dashboard & KPI | **Pelaporan** | Melihat grafik performa realisasi anggaran, gate stepper, status dokumen & metrik analitik | `active` |
| 11 | `perm_view_reports` | Unduh Laporan & Audit Log| **Pelaporan** | Mengunduh berkas laporan rekapitulasi, export data Excel/PDF, dan riwayat aktivitas | `active` |
| 12 | `perm_manage_users` | Kelola Pengguna | **Admin** | Menambah, menyunting, mereset password, dan menonaktifkan akun user | `active` |
| 13 | `perm_manage_config`| Konfigurasi Master & Alur | **Admin** | Mengatur workflow approval, pemetaan role permission, dan parameter sistem | `active` |

---

## 4. Master Data: Type Approval (Kategori Alur Persetujuan)
Klasifikasi kategori alur persetujuan yang menentukan rantai verifikator (*approver step sequence*).

| No | Kode Approval | Nama Type Approval | Ruang Lingkup & Keterangan Penggunaan | Status |
|:---:|:---:|:---|:---|:---:|
| 1 | `CAP` | Capex Investment | Alur usulan belanja modal mesin, alat berat, gedung & infrastruktur baru bernilai besar | `active` |
| 2 | `FOH` | Factory Overhead | Pengeluaran biaya operasional rutin pabrik (listrik, bahan penolong, maintenance) | `active` |
| 3 | `GOP` | General Operational Expense | Pengeluaran operasional umum kantor non-manufaktur | `active` |
| 4 | `PRICE_PROD` | Otorisasi Harga Product | Otorisasi harga bahan baku utama, sub-komponen part manufaktur dari supplier | `active` |
| 5 | `PRICE_NONPROD`| Otorisasi Harga Non-Product| Otorisasi harga spare parts mesin, consumable, alat kerja, jasa kontraktor/perbaikan | `active` |

---

## 5. Master Data: Daftar Pengguna (User Accounts)
Daftar akun pengguna riil yang telah terkonfigurasi pada sistem:

| No | NPK | Nama Lengkap | Username | Departemen | Role Sistem | Status |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|
| 1 | `ADM001` | Administrator Sistem | `admin` | `IT` | `Admin` | `active` |
| 2 | `ENG010` | Budi Santoso | `budi.eng` | `ENG` | `Proposer` | `active` |
| 3 | `ENG001` | Ir. Hendra Gunawan | `hendra.hdept` | `ENG` | `Head Dept` | `active` |
| 4 | `ACC005` | Siti Rahmawati | `siti.acc` | `FIN` | `Accounting` | `active` |
| 5 | `FIN002` | Agus Pratama | `agus.fin` | `FIN` | `Finance` | `active` |
| 6 | `KOM001` | Tim Komite Investasi | `komite.capex` | `FIN` | `Komite CAPEX` | `active` |
| 7 | `PUR003` | Rina Wijaya | `rina.pur` | `PUR` | `Purchasing` | `active` |
| 8 | `PUR001` | Doni Kusuma | `doni.hdept` | `PUR` | `Head Dept` | `active` |
| 9 | `DIV001` | Bambang Subroto | `bambang.div` | `ENG` | `DIV ENG` | `active` |
| 10 | `DIR001` | Michael Tanuwidjaja | `michael.dir` | `OMD` | `DIR` | `active` |
| 11 | `PRE001` | Joko Prasetyo | `joko.presdir` | `OMD` | `PRESDIR` | `active` |

---

## 6. Settings: Matriks Role Permission (Hak Akses per Role)
Matriks pemetaan hak akses operasional untuk setiap peran pengguna di dalam sistem:

| No | Role Pengguna | Permissions yang Diberikan (*Matrix Hak Akses*) |
|:---:|:---|:---|
| 1 | **Admin** | *Semua Hak Akses (Full Access)*: `perm_create_capex`, `perm_review_capex`, `perm_committee_review`, `perm_closing_capex`, `perm_create_bodr`, `perm_approve_bodr`, `perm_create_price`, `perm_approve_price`, `perm_sync_bodr`, `perm_view_dashboard`, `perm_view_reports`, `perm_manage_users`, `perm_manage_config` |
| 2 | **Proposer** | `perm_create_capex`, `perm_create_bodr`, `perm_create_price`, `perm_view_dashboard` |
| 3 | **Head Dept** | `perm_create_capex`, `perm_review_capex`, `perm_approve_bodr`, `perm_approve_price`, `perm_view_dashboard`, `perm_view_reports` |
| 4 | **Accounting** | `perm_review_capex`, `perm_approve_bodr`, `perm_sync_bodr`, `perm_view_dashboard`, `perm_view_reports` |
| 5 | **Finance** | `perm_review_capex`, `perm_approve_bodr`, `perm_approve_price`, `perm_sync_bodr`, `perm_view_dashboard`, `perm_view_reports` |
| 6 | **Komite CAPEX** | `perm_review_capex`, `perm_committee_review`, `perm_closing_capex`, `perm_view_dashboard`, `perm_view_reports` |
| 7 | **Purchasing** | `perm_create_price`, `perm_sync_bodr`, `perm_view_dashboard`, `perm_view_reports` |
| 8 | **DIV ENG** | `perm_review_capex`, `perm_committee_review`, `perm_approve_bodr`, `perm_view_dashboard`, `perm_view_reports` |
| 9 | **DEPUTY PLAN** | `perm_committee_review`, `perm_approve_bodr`, `perm_view_dashboard`, `perm_view_reports` |
| 10 | **DIR** | `perm_committee_review`, `perm_closing_capex`, `perm_approve_bodr`, `perm_approve_price`, `perm_view_dashboard`, `perm_view_reports` |
| 11 | **PRESDIR** | `perm_committee_review`, `perm_closing_capex`, `perm_approve_bodr`, `perm_approve_price`, `perm_view_dashboard`, `perm_view_reports` |

---

## 7. Alur Feasibility Study & Sidang Komite CAPEX (Gate Process)
Struktur tahapan kelayakan investasi belanja modal (*Capital Expenditure Feasibility Study*):

```
[Gate 0: Idea Submission]
       │  (Diajukan oleh: Proposer / Dept User)
       ▼
[Gate 1: Finance & Technical Review]
       │  (Diverifikasi oleh: Head Dept, Accounting & Finance Reviewer)
       ▼
[Gate 2: Committee Review / Sidang Komite CAPEX]
       │  (Disidangkan & Diputuskan oleh: Komite CAPEX, DIV ENG, Deputy Plant, DIR & PRESDIR)
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
   [Approved]       [Revised]         [Rejected]
       │                 │                 │
       ▼                 ▼                 ▼
[Gate 3: Procurement] (Revisi Data) (Investasi Dibatalkan)
       │  (Eksekusi BODR & Otorisasi Harga Purchasing)
       ▼
[Gate 4: Commissioning & Installation]
       │
       ▼
[Gate 5: Benefit Realization & Post Audit]
       │
       ▼
[Gate 6: Project Closing]
```

---

## 8. Settings: Approval Workflow (BODR)
Urutan tahapan persetujuan proposal BODR per kombinasi Departemen dan Type Approval:

| No | Departemen | Type Approval | Urutan Langkah Approver (User Nyata) | Status |
|:---:|:---:|:---:|:---|:---:|
| 1 | **ENG** (Engineering) | `CAP` (Capex Investment) | **Tahap 1**: Ir. Hendra Gunawan (`Head Dept`)<br>**Tahap 2**: Siti Rahmawati (`Accounting`)<br>**Tahap 3**: Agus Pratama (`Finance`)<br>**Tahap 4**: Tim Komite Investasi (`Komite CAPEX`)<br>**Tahap 5**: Bambang Subroto (`DIV ENG`)<br>**Tahap 6**: Michael Tanuwidjaja (`DIR`) | `active` |
| 2 | **ENG** (Engineering) | `FOH` (Factory Overhead) | **Tahap 1**: Ir. Hendra Gunawan (`Head Dept`)<br>**Tahap 2**: Siti Rahmawati (`Accounting`)<br>**Tahap 3**: Agus Pratama (`Finance`) | `active` |
| 3 | **PROD** (Production) | `CAP` (Capex Investment) | **Tahap 1**: Ir. Hendra Gunawan (`Head Dept`)<br>**Tahap 2**: Siti Rahmawati (`Accounting`)<br>**Tahap 3**: Agus Pratama (`Finance`)<br>**Tahap 4**: Tim Komite Investasi (`Komite CAPEX`)<br>**Tahap 5**: Michael Tanuwidjaja (`DIR`) | `active` |
| 4 | **IT** (IT) | `GOP` (General Operational) | **Tahap 1**: Administrator Sistem (`Head Dept`)<br>**Tahap 2**: Siti Rahmawati (`Accounting`)<br>**Tahap 3**: Agus Pratama (`Finance`) | `active` |

---

## 9. Settings: Approval Price Workflow (Otorisasi Harga Purchasing)
Urutan tahapan persetujuan penetapan harga penawaran vendor:

| No | Departemen | Type Approval | Urutan Langkah Approver (User Nyata) | Status |
|:---:|:---:|:---:|:---|:---:|
| 1 | **PUR** (Purchasing) | `PRICE_PROD` | **Tahap 1**: Doni Kusuma (`Head Dept Purchasing`)<br>**Tahap 2**: Agus Pratama (`Finance Reviewer`)<br>**Tahap 3**: Michael Tanuwidjaja (`DIR / Direktur`) | `active` |
| 2 | **PUR** (Purchasing) | `PRICE_NONPROD` | **Tahap 1**: Doni Kusuma (`Head Dept Purchasing`)<br>**Tahap 2**: Agus Pratama (`Finance Reviewer`) | `active` |
| 3 | **OMD** (Operation) | `PRICE_NONPROD` | **Tahap 1**: Doni Kusuma (`Head Dept Purchasing`)<br>**Tahap 2**: Agus Pratama (`Finance Reviewer`) | `active` |

---

## 10. Settings: Dept Settings (Penanggung Jawab Departemen)
Konfigurasi pemetaan pejabat **Head Dept** dan pejabat **Accounting** untuk masing-masing departemen:

| No | Departemen | Keterangan Departemen | Head Dept (User) | Accounting (User) |
|:---:|:---:|:---|:---|:---|
| 1 | **ENG** (Engineering) | Departemen Rekayasa Teknik & Fasilitas Pabrik | Ir. Hendra Gunawan | Siti Rahmawati |
| 2 | **PUR** (Purchasing) | Departemen Pengadaan Barang, Jasa & Vendor | Doni Kusuma | Siti Rahmawati |
| 3 | **FIN** (Finance) | Departemen Keuangan, Pajak & Akuntansi | Agus Pratama | Siti Rahmawati |
| 4 | **IT** (IT) | Departemen Teknologi Informasi & Infrastruktur | Administrator Sistem | Siti Rahmawati |
| 5 | **PROD** (Production) | Divisi Pelaksana Manufaktur & Lini Produksi | Ir. Hendra Gunawan | Siti Rahmawati |
| 6 | **OMD** (Operation) | Manajemen Operasional & Perencanaan Plant | Michael Tanuwidjaja | Siti Rahmawati |

---

## 11. Settings: Akses Portal (Hak Akses Modul per Pengguna)
Konfigurasi keterlihatan modul portal saat pengguna berhasil masuk (*login*):

| No | Pengguna (NPK - Username) | Departemen & Role | Modul CAPEX | Modul BODR | Modul Otorisasi Harga | Keterangan & Alur Kerja |
|:---:|:---|:---:|:---:|:---:|:---:|:---|
| 1 | **Administrator Sistem** (`admin`) | `IT` — `Admin` | `Aktif` | `Aktif` | `Aktif` | *Auto-redirect ke Portal Admin & Pengaturan Master* |
| 2 | **Budi Santoso** (`budi.eng`) | `ENG` — `Proposer` | `Aktif` | `Aktif` | `Nonaktif` | Mengajukan proposal CAPEX (Gate 0) & usulan BODR |
| 3 | **Ir. Hendra Gunawan** (`hendra.hdept`) | `ENG` — `Head Dept` | `Aktif` | `Aktif` | `Nonaktif` | Menyetujui usulan teknis CAPEX & BODR engineering |
| 4 | **Siti Rahmawati** (`siti.acc`) | `FIN` — `Accounting` | `Aktif` | `Aktif` | `Aktif` | Memverifikasi kode akun anggaran di semua modul portal |
| 5 | **Agus Pratama** (`agus.fin`) | `FIN` — `Finance` | `Aktif` | `Aktif` | `Aktif` | Review finansial CAPEX (Gate 1), BODR & harga vendor |
| 6 | **Tim Komite Investasi** (`komite.capex`)| `FIN` — `Komite CAPEX`| `Aktif` | `Aktif` | `Nonaktif` | Sidang evaluasi & voting persetujuan investasi CAPEX (Gate 2) |
| 7 | **Rina Wijaya** (`rina.pur`) | `PUR` — `Purchasing` | `Nonaktif` | `Nonaktif` | `Aktif` | Buyer penginput data perbandingan & negosiasi harga |
| 8 | **Doni Kusuma** (`doni.hdept`) | `PUR` — `Head Dept` | `Nonaktif` | `Nonaktif` | `Aktif` | Kepala bagian purchasing & penyetuju tahap 1 harga |
| 9 | **Bambang Subroto** (`bambang.div`) | `ENG` — `DIV ENG` | `Aktif` | `Aktif` | `Nonaktif` | Anggota komite & approver tingkat divisi engineering |
| 10 | **Michael Tanuwidjaja** (`michael.dir`) | `OMD` — `DIR` | `Aktif` | `Aktif` | `Aktif` | Direktur penyetuju komite CAPEX, BODR & Otorisasi Harga |
| 11 | **Joko Prasetyo** (`joko.presdir`) | `OMD` — `PRESDIR` | `Aktif` | `Aktif` | `Aktif` | Penyetuju akhir investasi strategis bernilai tinggi |

---

*Laporan ini disusun secara komprehensif sebagai acuan konfigurasi data operasional pada sistem Portal Admin PT Menara Terus Makmur.*

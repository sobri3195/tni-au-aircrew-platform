from __future__ import annotations

import math
import textwrap
import zlib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / 'docs'
GENERATED_DIR = DOCS_DIR / '.generated-docx'
ASSET_DIR = GENERATED_DIR / 'generated-assets'
OUTPUT_DOCX = GENERATED_DIR / 'aircrew-platform-documentation.docx'

PX_TO_EMU = 9525
PAGE_WIDTH_DXA = 11906  # A4 portrait approx 8.27in
CONTENT_WIDTH_DXA = 9000
TABLE_WIDTH_DXA = 9000

PALETTE = {
    'navy': (16, 38, 78),
    'sky': (32, 124, 229),
    'teal': (15, 147, 134),
    'green': (34, 197, 94),
    'amber': (245, 158, 11),
    'orange': (249, 115, 22),
    'rose': (225, 29, 72),
    'purple': (124, 58, 237),
    'slate': (71, 85, 105),
    'gray': (148, 163, 184),
    'light': (241, 245, 249),
    'white': (255, 255, 255),
    'black': (15, 23, 42),
}

FONT = {
    'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    'G': ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
    'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    'J': ['11111', '00010', '00010', '00010', '10010', '10010', '01100'],
    'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    'W': ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
    '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
    '%': ['11001', '11010', '00100', '01000', '10110', '00110', '00000'],
    '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
    ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}


@dataclass
class Paragraph:
    text: str
    style: str = 'body'
    align: str = 'left'
    page_break_before: bool = False
    keep_with_next: bool = False


@dataclass
class TableBlock:
    title: str | None
    headers: list[str]
    rows: list[list[str]]
    widths: list[int] | None = None


@dataclass
class ImageBlock:
    path: Path
    caption: str
    width_px: int
    height_px: int


@dataclass
class Section:
    title: str
    body: list[object] = field(default_factory=list)


def wrap(text: str, width: int = 104) -> list[str]:
    return textwrap.wrap(text, width=width, break_long_words=False, replace_whitespace=False)


def make_png(path: Path, width: int, height: int, pixels: bytearray):
    def chunk(tag: bytes, data: bytes) -> bytes:
        return len(data).to_bytes(4, 'big') + tag + data + zlib.crc32(tag + data).to_bytes(4, 'big')

    raw = bytearray()
    stride = width * 3
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(pixels[start:start + stride])

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr = width.to_bytes(4, 'big') + height.to_bytes(4, 'big') + bytes([8, 2, 0, 0, 0])
    png.extend(chunk(b'IHDR', ihdr))
    png.extend(chunk(b'IDAT', zlib.compress(bytes(raw), 9)))
    png.extend(chunk(b'IEND', b''))
    path.write_bytes(png)


class Canvas:
    def __init__(self, width: int, height: int, bg: tuple[int, int, int]):
        self.width = width
        self.height = height
        self.pixels = bytearray(width * height * 3)
        self.fill(bg)

    def fill(self, color: tuple[int, int, int]):
        r, g, b = color
        for i in range(0, len(self.pixels), 3):
            self.pixels[i:i + 3] = bytes((r, g, b))

    def set_pixel(self, x: int, y: int, color: tuple[int, int, int]):
        if 0 <= x < self.width and 0 <= y < self.height:
            idx = (y * self.width + x) * 3
            self.pixels[idx:idx + 3] = bytes(color)

    def rect(self, x: int, y: int, w: int, h: int, color: tuple[int, int, int], fill: bool = True, stroke: tuple[int, int, int] | None = None, stroke_width: int = 2):
        if fill:
            for yy in range(max(0, y), min(self.height, y + h)):
                row = (yy * self.width + max(0, x)) * 3
                for xx in range(max(0, x), min(self.width, x + w)):
                    idx = (yy * self.width + xx) * 3
                    self.pixels[idx:idx + 3] = bytes(color)
        if stroke:
            for s in range(stroke_width):
                self.line(x, y + s, x + w - 1, y + s, stroke)
                self.line(x, y + h - 1 - s, x + w - 1, y + h - 1 - s, stroke)
                self.line(x + s, y, x + s, y + h - 1, stroke)
                self.line(x + w - 1 - s, y, x + w - 1 - s, y + h - 1, stroke)

    def line(self, x1: int, y1: int, x2: int, y2: int, color: tuple[int, int, int], thickness: int = 1):
        dx = abs(x2 - x1)
        sx = 1 if x1 < x2 else -1
        dy = -abs(y2 - y1)
        sy = 1 if y1 < y2 else -1
        err = dx + dy
        while True:
            for tx in range(-(thickness // 2), thickness // 2 + 1):
                for ty in range(-(thickness // 2), thickness // 2 + 1):
                    self.set_pixel(x1 + tx, y1 + ty, color)
            if x1 == x2 and y1 == y2:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x1 += sx
            if e2 <= dx:
                err += dx
                y1 += sy

    def arrow(self, x1: int, y1: int, x2: int, y2: int, color: tuple[int, int, int], thickness: int = 4):
        self.line(x1, y1, x2, y2, color, thickness)
        angle = math.atan2(y2 - y1, x2 - x1)
        for offset in (math.pi - 0.55, math.pi + 0.55):
            hx = int(x2 + math.cos(angle + offset) * 18)
            hy = int(y2 + math.sin(angle + offset) * 18)
            self.line(x2, y2, hx, hy, color, thickness)

    def text(self, x: int, y: int, text: str, color: tuple[int, int, int], scale: int = 2):
        cursor = x
        for char in text.upper():
            glyph = FONT.get(char, FONT[' '])
            for row, pattern in enumerate(glyph):
                for col, bit in enumerate(pattern):
                    if bit == '1':
                        for sy in range(scale):
                            for sx in range(scale):
                                self.set_pixel(cursor + col * scale + sx, y + row * scale + sy, color)
            cursor += (len(glyph[0]) + 1) * scale

    def save(self, path: Path):
        make_png(path, self.width, self.height, self.pixels)


def build_assets() -> dict[str, Path]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    assets: dict[str, Path] = {}

    # Architecture diagram
    canvas = Canvas(1100, 620, PALETTE['white'])
    canvas.text(40, 24, 'TNI AU AIRCREW PLATFORM - ARCHITECTURE LAYERS', PALETTE['navy'], scale=3)
    blocks = [
        ('UI SHELL', 70, 120, 180, 90, PALETTE['sky']),
        ('ROUTER', 290, 120, 180, 90, PALETTE['teal']),
        ('CONTEXT', 510, 120, 180, 90, PALETTE['purple']),
        ('RBAC', 730, 120, 140, 90, PALETTE['amber']),
        ('EXPORT', 910, 120, 140, 90, PALETTE['orange']),
        ('PAGES', 180, 310, 220, 110, PALETTE['green']),
        ('MOCK DATA', 450, 310, 220, 110, PALETTE['slate']),
        ('LOCAL STORAGE', 720, 310, 240, 110, PALETTE['rose']),
    ]
    for label, x, y, w, h, color in blocks:
        canvas.rect(x, y, w, h, color, fill=True, stroke=PALETTE['navy'])
        canvas.text(x + 18, y + 30, label, PALETTE['white'], scale=3)
    for x1, y1, x2, y2 in [
        (250, 165, 290, 165), (470, 165, 510, 165), (690, 165, 730, 165), (870, 165, 910, 165),
        (380, 250, 290, 310), (600, 250, 560, 310), (800, 250, 820, 310),
    ]:
        canvas.arrow(x1, y1, x2, y2, PALETTE['navy'])
    canvas.text(70, 520, 'FLOW: UI -> ROUTES -> STATE -> RULES/EXPORT -> LOCAL STORAGE', PALETTE['black'], scale=2)
    path = ASSET_DIR / 'architecture_layers.png'
    canvas.save(path)
    assets['architecture'] = path

    # Feature distribution chart
    groups = [
        ('MED', 8, PALETTE['sky']), ('TRAIN', 5, PALETTE['green']), ('OPS', 5, PALETTE['amber']),
        ('RISK', 5, PALETTE['rose']), ('CMD', 7, PALETTE['purple']), ('EXT', 4, PALETTE['teal']),
        ('LIFE', 1, PALETTE['orange']), ('HW', 6, PALETTE['slate']), ('GOV', 4, PALETTE['navy']), ('SW', 4, PALETTE['gray'])
    ]
    canvas = Canvas(1100, 700, PALETTE['white'])
    canvas.text(40, 24, 'FEATURE GROUP DISTRIBUTION', PALETTE['navy'], scale=3)
    max_value = max(value for _, value, _ in groups)
    y = 100
    for label, value, color in groups:
        canvas.text(60, y + 14, label, PALETTE['black'], scale=3)
        width = int((value / max_value) * 760)
        canvas.rect(220, y, width, 42, color, fill=True, stroke=PALETTE['navy'])
        canvas.text(1000, y + 14, str(value), PALETTE['black'], scale=3)
        y += 56
    path = ASSET_DIR / 'feature_group_distribution.png'
    canvas.save(path)
    assets['feature_distribution'] = path

    # Seed dataset volume chart
    datasets = [
        ('PROFILES', 4, PALETTE['sky']), ('LOGBOOK', 80, PALETTE['teal']), ('SCHEDULE', 30, PALETTE['green']),
        ('NOTAM', 16, PALETTE['amber']), ('TRAIN', 10, PALETTE['orange']), ('INCIDENT', 14, PALETTE['rose']),
        ('ORM', 2, PALETTE['purple']), ('AUDIT', 2, PALETTE['navy']), ('MSG', 2, PALETTE['slate']), ('RIKKES', 4, PALETTE['gray'])
    ]
    canvas = Canvas(1200, 700, PALETTE['white'])
    canvas.text(40, 24, 'SEED DATASET VOLUME', PALETTE['navy'], scale=3)
    canvas.line(90, 620, 1120, 620, PALETTE['black'], 3)
    canvas.line(90, 120, 90, 620, PALETTE['black'], 3)
    max_value = max(value for _, value, _ in datasets)
    x = 140
    bar_width = 78
    for label, value, color in datasets:
        height = int((value / max_value) * 420)
        canvas.rect(x, 620 - height, bar_width, height, color, fill=True, stroke=PALETTE['navy'])
        canvas.text(x + 18, 630, label[:3], PALETTE['black'], scale=2)
        canvas.text(x + 12, 620 - height - 26, str(value), PALETTE['black'], scale=2)
        x += 98
    path = ASSET_DIR / 'seed_dataset_volume.png'
    canvas.save(path)
    assets['seed_volume'] = path

    # Mission lifecycle workflow
    stages = ['DRAFT', 'BRIEF', 'ORM', 'GO/NO-GO', 'AIRBORNE', 'DEBRIEF', 'CLOSED']
    colors = [PALETTE['gray'], PALETTE['sky'], PALETTE['amber'], PALETTE['orange'], PALETTE['green'], PALETTE['purple'], PALETTE['navy']]
    canvas = Canvas(1200, 420, PALETTE['white'])
    canvas.text(40, 24, 'MISSION LIFECYCLE WORKFLOW', PALETTE['navy'], scale=3)
    x = 44
    for idx, stage in enumerate(stages):
        canvas.rect(x, 170, 140, 86, colors[idx], fill=True, stroke=PALETTE['navy'])
        canvas.text(x + 16, 200, stage, PALETTE['white'], scale=3)
        if idx < len(stages) - 1:
            canvas.arrow(x + 140, 213, x + 176, 213, PALETTE['navy'])
        x += 164
    canvas.text(60, 320, 'WORKFLOW EMPHASIZES APPROVALS, EVIDENCE, SLA, AND POST-MISSION CLOSURE', PALETTE['black'], scale=2)
    path = ASSET_DIR / 'mission_lifecycle_workflow.png'
    canvas.save(path)
    assets['mission_workflow'] = path

    return assets


def p(text: str, style: str = 'body', align: str = 'left', page_break_before: bool = False, keep_with_next: bool = False) -> Paragraph:
    return Paragraph(text=text, style=style, align=align, page_break_before=page_break_before, keep_with_next=keep_with_next)


def table(title: str | None, headers: list[str], rows: list[list[str]], widths: list[int] | None = None) -> TableBlock:
    return TableBlock(title=title, headers=headers, rows=rows, widths=widths)


def img(path: Path, caption: str, width_px: int, height_px: int) -> ImageBlock:
    return ImageBlock(path=path, caption=caption, width_px=width_px, height_px=height_px)


def build_sections(assets: dict[str, Path]) -> list[Section]:
    return [
        Section('Halaman 1 — Sampul', [
            p('DOKUMENTASI KOMPREHENSIF PLATFORM TNI AU AIRCREW', 'title', 'center'),
            p('Versi dokumen DOCX berbasis artefak source code repository.', 'subtitle', 'center'),
            p('Target: 30 halaman, memuat fitur, mekanisme, data, tabel, serta grafik/diagram pendukung.', 'subtitle', 'center'),
            p('Ruang lingkup dokumen ini mencakup dashboard readiness, e-logbook, ORM, training, safety, medical, rikkes, pelaporan, panel admin, generic module engine, serta peta fitur yang diminta pada roadmap penyempurnaan. Semua isi disusun dari struktur React + TypeScript + TailwindCSS yang berjalan frontend-only dengan localStorage sebagai persistence utama.', 'body'),
            img(assets['architecture'], 'Gambar 1. Arsitektur logis platform dari shell UI sampai local storage dan utilitas ekspor.', 900, 507),
            p('Tanggal penyusunan: 19 Maret 2026. Dokumen ini dapat diregenerasi dengan menjalankan skrip generator pada folder docs.', 'body'),
        ]),
        Section('Halaman 2 — Ringkasan eksekutif', [
            p('Platform TNI AU Aircrew adalah single-page application yang memusatkan pengelolaan readiness personel, data sortie, risiko operasi, pelatihan, NOTAM, safety reporting, data medis, dan pelaporan komando di browser. Tidak ada backend API pada implementasi saat ini; seluruh state aplikasi digerakkan oleh React Context dan persisted ke localStorage.', 'body'),
            p('Kekuatan utama platform adalah breadth fitur. Dashboard menyatukan readiness score, alert, predictive safety, override komando, ringkasan Rikkes, dan quick recommendations. Modul-modul detail kemudian menyediakan input, validasi, simulasi aturan, dan ekspor agar keputusan operasi dapat dilakukan lebih cepat walau sistem masih mock-first.', 'body'),
            p('Untuk komando, aplikasi ini sudah memberi pondasi decision support: ada indikator kesiapan, fit-check assignment, risk scoring, status pelatihan, incident workflow, serta master data terpusat. Untuk tahap berikutnya, fondasi ini dapat ditingkatkan menjadi sistem terintegrasi dengan backend, sinkronisasi data skuadron, audit trail immutable, dan integrasi sensor/alat kesehatan.', 'body'),
            table('Tabel 1. Ringkasan manfaat operasional', ['Area', 'Nilai Saat Ini', 'Nilai Lanjutan yang Mungkin'], [
                ['Kesiapan misi', 'Readiness score + alert + override', 'Decision support lintas unit dan misi real-time'],
                ['Safety', 'ORM dan incident reporting', 'Predictive safety engine hybrid rules/ML'],
                ['Training', 'Tracker currency dan planner prioritas', 'Adaptive training optimization'],
                ['Medical', 'Status readiness + modul Rikkes', 'Integrasi MCU, restriksi, medication, fatigue'],
                ['Data', 'Mock + local storage', 'Backend, integration bus, audit governance'],
            ]),
            p('Kesimpulan strategis: codebase ini sudah cukup kaya untuk dijadikan baseline demonstrator sistem komando digital, namun masih membutuhkan orkestrasi data, integrasi identitas, dan quality gate produksi sebelum dipakai sebagai sistem operasi lapangan penuh.', 'body'),
        ]),
        Section('Halaman 3 — Tujuan sistem, pengguna, dan ruang lingkup', [
            p('Pengguna utama yang diakomodasi di codebase adalah Pilot, Flight Safety Officer, Ops Officer, Medical, dan Commander/Admin. Setiap role memiliki hak akses berbeda terhadap route dan aksi, sehingga aplikasi dapat digunakan untuk beberapa sudut pandang operasional tanpa harus memecah antarmuka menjadi beberapa aplikasi terpisah.', 'body'),
            p('Sistem ini berorientasi pada operasi aircrew TNI AU. Ruang lingkupnya bukan sekadar pencatatan administrasi, tetapi menutup loop dari readiness, sortie planning, pre-mission risk review, safety reporting, medical review, hingga command analytics dan mission lifecycle.', 'body'),
            table('Tabel 2. Persona dan kebutuhan utama', ['Role', 'Kebutuhan Primer', 'Modul Paling Relevan'], [
                ['Pilot', 'Catat sortie, lihat NOTAM, lapor hazard, cek readiness', 'Dashboard, Logbook, NOTAM, Safety, Training'],
                ['Flight Safety Officer', 'Nilai ORM, monitor trend safety, review alert', 'Dashboard, ORM, Reports, Safety'],
                ['Ops Officer', 'Susun jadwal, kontrol readiness, kelola pelatihan', 'Dashboard, Schedule, Training, Reports'],
                ['Medical', 'Lihat status fit, Rikkes, screening aeromedical', 'Medical, Rikkes, modul medical roadmap'],
                ['Commander/Admin', 'Lihat seluruh posture, approve override, atur master data', 'Dashboard, Reports, Admin, command modules'],
            ]),
            p('Dari sisi ruang lingkup fungsional, codebase memuat dua lapisan: core feature routes yang sudah memiliki halaman khusus dan requested feature modules yang dipetakan lewat generic engine. Pola ini membuat aplikasi mudah diperluas tanpa selalu membuat komponen halaman baru dari nol.', 'body'),
        ]),
        Section('Halaman 4 — Arsitektur aplikasi dan runtime', [
            p('Aplikasi dibangun dengan React 18, React Router, TypeScript, TailwindCSS, dan Vite. Runtime bersifat client-side sepenuhnya. BrowserRouter menangani navigasi route, AppShell membungkus layout sidebar/topbar, dan AppProvider menjadi sumber state global untuk seluruh halaman.', 'body'),
            p('Karena frontend-only, semua operasi data terjadi di browser: initial seed dimuat dari berkas data mock, lalu state dibaca dan ditulis ke localStorage. Service worker diregistrasikan untuk dasar perilaku offline-first, meskipun belum ada strategi cache data kompleks atau sinkronisasi background.', 'body'),
            img(assets['architecture'], 'Gambar 2. Lapisan UI, routing, state, aturan akses, util ekspor, mock data, dan local storage.', 900, 507),
            table('Tabel 3. Lapisan arsitektur', ['Lapisan', 'Isi Utama', 'Peran'], [
                ['UI/Layout', 'Sidebar, Topbar, AppShell, Badge, Modal, Table, Toast, Timeline', 'Presentasi dan navigasi'],
                ['Pages', 'Dashboard, Logbook, ORM, Training, Safety, Medical, Rikkes, dll.', 'Workflow operasional'],
                ['Context', 'Reducer, dispatch, derived readiness score', 'State global aplikasi'],
                ['Data', 'Mock data, Rikkes records, feature modules, schema blueprint', 'Seed dan metadata'],
                ['Utils', 'Readiness, RBAC, export, storage, date, PDF Rikkes', 'Business rule dan helper'],
            ]),
            p('Arsitektur ini sangat cocok untuk prototipe, demonstrator, atau aplikasi unit kecil yang belum membutuhkan backend. Namun untuk operasi multi-user, state dan audit perlu dipindahkan ke server agar tidak terisolasi per browser/perangkat.', 'body'),
        ]),
        Section('Halaman 5 — State management dan persistence', [
            p('State global terdiri dari role, theme, missionProfile, login status, global search, profiles, logbook, schedule, notams, trainings, incidents, ORM, notifications, audit logs, dan messages. Reducer memproses aksi seperti login, ganti role, ubah mission profile, tambah logbook, tambah schedule, tambah ORM, tambah training, tambah incident, tambah audit, dan acknowledge NOTAM.', 'body'),
            p('Setiap perubahan state ditulis kembali ke localStorage dengan kunci utama state aplikasi. Mekanisme ini sederhana namun efektif untuk demo: refresh halaman tidak menghapus data, draft form tetap tersimpan, dan banyak halaman memakai hook useLocalStorageState untuk menyimpan filter, draft input, atau state workspace per modul.', 'body'),
            table('Tabel 4. Komponen state global utama', ['Komponen', 'Bentuk Data', 'Kegunaan'], [
                ['profiles', 'Array pilot profile', 'Status aircrew, rating, expiry IFR/NVG'],
                ['logbook', 'Array sortie entries', 'Jam terbang, type, remarks, IFR/NVG'],
                ['schedule', 'Array kegiatan', 'Sortie/training/briefing terjadwal'],
                ['trainings', 'Array training item', 'Currency, expiry, status'],
                ['incidents', 'Array safety reports', 'Hazard, near-miss, incident'],
                ['orm', 'Array ORM assessment', 'Risk level, mitigation, threat level'],
                ['auditLogs', 'Array audit entry', 'Jejak create/update/access denied'],
            ]),
            p('Trade-off penting: localStorage tidak memiliki kontrol konkurensi, tidak multi-user, dan tidak aman untuk data rahasia jangka panjang. Karena itu, mekanisme saat ini tepat untuk simulasi operasi, tetapi bukan final architecture untuk deployment sensitif.', 'body'),
        ]),
        Section('Halaman 6 — Navigasi, shell UI, dan pengalaman penggunaan', [
            p('Navigasi utama diatur oleh AppShell yang membungkus semua route terproteksi. Aplikasi menyediakan halaman login mock, sidebar untuk modul, topbar untuk global search dan kontrol tema, serta route fallback ke dashboard. Struktur ini memberi pengalaman mirip command application dengan akses cepat antar domain operasi.', 'body'),
            p('Selain core pages, banyak route diarahkan ke GenericFeaturePage. Artinya, aplikasi dapat menampilkan modul baru berbasis metadata: judul, deskripsi, checklist workflow, CRUD schema, export dataset, import JSON, dan score kesehatan modul. Ini adalah desain yang sangat efisien untuk ekspansi backlog fitur tanpa memecah maintainability.', 'body'),
            table('Tabel 5. Core route aplikasi', ['Route', 'Fungsi Utama', 'Catatan'], [
                ['/', 'Dashboard readiness', 'Ringkasan posture dan alert komando'],
                ['/logbook', 'E-Logbook', 'Tambah sortie dan rekap jam terbang'],
                ['/orm', 'Operational Risk Management', 'Scoring risiko dan mitigasi'],
                ['/training', 'Training & Currency Tracker', 'Expiry, planner, add training'],
                ['/schedule', 'Schedule & Sortie Planner', 'Conflict detection dan fit check'],
                ['/notam', 'NOTAM & Airspace Notes', 'Filter area/base dan acknowledge'],
                ['/safety', 'Flight Safety Reporting', 'Hazard / near-miss / incident'],
                ['/medical', 'Medical readiness', 'Aeromedical screening terstruktur'],
                ['/rikkes', 'Rikkes', 'Daftar/detail/PDF hasil pemeriksaan'],
                ['/reports', 'Reports & Analytics', 'Snapshot readiness dan ekspor'],
            ]),
        ]),
        Section('Halaman 7 — Dashboard readiness dan command center', [
            p('Dashboard merupakan halaman paling strategis. Di sini sistem menggabungkan KPI 30 hari, sorties mingguan, aircraft availability mock, status medical, status currency, breakdown readiness component, readiness alerts, predictive safety alerts, readiness override, selected pilot drill-down, dan AI copilot recommendations.', 'body'),
            p('Dashboard juga memperkenalkan dua konsep komando penting. Pertama, readiness override yang memungkinkan keputusan No-Go, Conditional Go, atau Exceptional Go terhadap target crew/misi dengan alasan, mitigasi, masa berlaku, dan role pembuat. Kedua, predictive safety alert yang menggabungkan fatigue, training signals, NOTAM backlog, ORM high risk, dan status pilot untuk membentuk tier Monitor, FSO Review, atau Command Attention.', 'body'),
            table('Tabel 6. Komponen panel dashboard', ['Panel', 'Isi', 'Nilai Operasional'], [
                ['KPI cards', 'Jam terbang, sortie, availability, medical validity, currency', 'Snapshot cepat harian'],
                ['Readiness breakdown', '7 komponen berbobot', 'Jelaskan penyebab skor'],
                ['Alert queue', 'Critical/warning/info', 'Prioritisasi aksi'],
                ['Predictive safety', 'Score dan reason per pilot', 'Early warning'],
                ['Pilot drill-down', 'Medical, training, fatigue, qualification', 'Analisis individu'],
                ['AI copilot', 'Narasi risiko + rekomendasi', 'Action suggestion ke modul terkait'],
            ]),
            p('Dengan desain ini, dashboard bukan hanya halaman landing, tetapi benar-benar command center yang menyatukan domain operasi, safety, training, dan medical ke dalam satu alur keputusan.', 'body'),
        ]),
        Section('Halaman 8 — E-Logbook', [
            p('Modul E-Logbook mengelola sortie harian. User dapat memasukkan aircraft, sortie type, duration, day/night, IFR, NVG, dan remarks. Validasi mencegah input tidak realistis, misalnya duration harus lebih dari nol, maksimal 12 jam, sortie NVG hanya untuk night flight, dan remarks wajib untuk durasi panjang.', 'body'),
            p('Selain input, halaman menampilkan total jam, jam night, dan jam IFR. Data ditampilkan dalam tabel yang bisa difilter oleh global search. Karena dispatch aksi ADD_LOGBOOK melewati kontrol akses, role yang tidak berhak hanya bisa melihat data tanpa membuat entry baru.', 'body'),
            table('Tabel 7. Struktur data logbook', ['Field', 'Arti', 'Contoh'], [
                ['pilotId', 'Identitas aircrew', 'P001'],
                ['date', 'Waktu sortie', 'ISO timestamp'],
                ['aircraft', 'Tail number / tipe', 'F-16C TS-1601'],
                ['sortieType', 'Jenis misi', 'CAP / Training / Night Ops'],
                ['duration', 'Jam terbang', '1.5'],
                ['dayNight', 'Fase siang/malam', 'Day / Night'],
                ['ifr / nvg', 'Flag kualifikasi sortie', 'true / false'],
                ['remarks', 'Catatan flight', 'Crosswind approach'],
            ]),
            p('Seed data logbook berjumlah besar dan menjadi sumber penting untuk kalkulasi fatigue, sortie intensity, monthly reports, serta predictive safety signals. Karena itu, logbook berfungsi sebagai basis data operasional paling aktif di aplikasi.', 'body'),
        ]),
        Section('Halaman 9 — ORM (Operational Risk Management)', [
            p('Modul ORM menyediakan mekanisme penilaian risiko yang explainable. Input utama adalah mission type, crew rest hours, weather, aircraft status, dan threat level. Fungsi calcRisk kemudian menerapkan penalti berbasis kondisi untuk menghasilkan risk level Low, Medium, atau High berikut narasi mitigation default.', 'body'),
            p('Validasi tambahan membuat ORM terasa domain-aware, misalnya aircraft NMC hanya boleh untuk misi emergency dan threat level tinggi membutuhkan crew rest minimal 6 jam. Di bawah form, sistem menampilkan statistik jumlah ORM high/medium/low dan daftar assessment terbaru yang juga dapat disaring oleh global search.', 'body'),
            table('Tabel 8. Aturan penilaian ORM ringkas', ['Kondisi', 'Efek Skor', 'Makna'], [
                ['Crew rest < 8 jam', '+3', 'Risiko fatigue'],
                ['Weather marginal', '+2', 'Membutuhkan mitigasi tambahan'],
                ['Weather poor', '+4', 'Ancaman lingkungan tinggi'],
                ['Aircraft PMC', '+2', 'Kesiapan armada terbatas'],
                ['Aircraft NMC', '+4', 'Hanya layak untuk kondisi sangat khusus'],
                ['Threat level 1-5', '+1 s.d. +5', 'Faktor ancaman misi'],
            ]),
            p('Secara produk, modul ini sudah cukup baik sebagai MVP ORM builder. Pada tahap lanjutan, assessment bisa diperkaya dengan hazard tags, due owner, mitigation evidence, approval chain, dan historical comparison.', 'body'),
        ]),
        Section('Halaman 10 — Training & Currency Tracker', [
            p('Halaman training menggabungkan compliance dashboard, expiry forecast 30/60/90 hari, data table currency, dan planner prioritas per pilot. User dapat menambahkan training item baru dengan jenis training, pilot, dan mission focus. Status valid/expiring/expired diturunkan dari expiry date.', 'body'),
            p('Salah satu nilai terbaik modul ini adalah plannerRows. Di sana sistem menghitung priorityScore per pilot berdasarkan expiring soon count, expired count, mission focus weight, urgency NVG/IFR, low recent exposure, dan status aircrew. Dengan begitu, halaman tidak sekadar menjadi tabel expiry, tetapi sudah mulai memberi rekomendasi siapa yang harus diprioritaskan masuk slot pelatihan.', 'body'),
            img(assets['seed_volume'], 'Grafik 1. Volume seed dataset menunjukkan logbook sebagai sumber data dominan, diikuti schedule, NOTAM, training, incident, dan Rikkes.', 980, 572),
            table('Tabel 9. Kegunaan analitik training', ['Analitik', 'Manfaat'], [
                ['Compliance %', 'Melihat kepatuhan keseluruhan item training'],
                ['Forecast D30/D60/D90', 'Merencanakan kapasitas slot training'],
                ['Expired count', 'Menentukan bottleneck kesiapan'],
                ['Priority score', 'Urutan tindakan per aircrew'],
                ['Mission focus', 'Menyesuaikan prioritas dengan profil operasi'],
            ]),
        ]),
        Section('Halaman 11 — Schedule & Sortie Planner', [
            p('Modul schedule membawa aplikasi lebih dekat ke skenario operasi nyata. User dapat membuat event sortie, training, atau briefing, memilih base, waktu, assigned pilot, dan catatan assignment. Sistem lalu memeriksa overlap mingguan dan mengidentifikasi conflict IDs.', 'body'),
            p('Fitur paling kuat adalah evaluateCrewFit. Fungsi ini mengevaluasi profile status, training expiry, currency NVG/IFR, jam terbang 7 hari, ORM high-risk ber-rest rendah, backlog NOTAM, dan kepadatan schedule enam jam untuk menentukan status Fit, Conditional, atau No-Go. Dengan kata lain, schedule bukan hanya kalender, melainkan gate readiness sebelum sortie dilepas.', 'body'),
            table('Tabel 10. Komponen fit-check sortie assignment', ['Sinyal', 'Dampak', 'Implikasi'], [
                ['Grounded/Limited', 'Potongan skor besar', 'Perlu approval / blok penuh'],
                ['Expired training', '-30 per item', 'No-go potensial'],
                ['NVG/IFR currency mendekati habis', '-10', 'Conditional fit'],
                ['Jam terbang > 18 jam / 7 hari', '-12', 'Mitigasi fatigue'],
                ['ORM high risk + rest rendah', '-15', 'Naikkan pengawasan'],
                ['NOTAM pending > 4', '-8', 'Briefing wajib'],
                ['Terlalu banyak event berdekatan', '-15', 'Cegah overload'],
            ]),
            p('Secara konsep, modul ini sudah memadukan planning, readiness, dan safety. Ini adalah salah satu fitur paling dekat dengan value operasional riil.', 'body'),
        ]),
        Section('Halaman 12 — NOTAM & Airspace Notes', [
            p('Modul NOTAM menampilkan daftar NOTAM, area, base, dan isi notifikasi. User dapat memfilter berdasarkan area atau base, lalu melakukan acknowledge jika role memiliki hak yang sesuai. Acknowledge tersebut juga masuk ke audit log melalui reducer.', 'body'),
            p('Walaupun sederhana, NOTAM sangat penting di model readiness. Jumlah NOTAM yang belum di-acknowledge mempengaruhi notamScore pada readiness calculation, memengaruhi alert, dan menjadi salah satu sinyal predictive safety. Ini menunjukkan desain aplikasi sudah menghubungkan compliance task sederhana dengan keputusan operasi yang lebih luas.', 'body'),
            table('Tabel 11. Peran NOTAM dalam sistem', ['Elemen', 'Fungsi'], [
                ['Acknowledge status', 'Menunjukkan apakah crew/ops sudah review NOTAM'],
                ['Area/base filter', 'Memudahkan briefing lokal'],
                ['Readiness score', 'Mempengaruhi komponen NOTAM compliance'],
                ['Predictive alert', 'Backlog acknowledgement menaikkan risiko'],
                ['Schedule fit-check', 'Pending NOTAM memberi penalti assignment'],
            ]),
            p('Roadmap selanjutnya dapat menambahkan severity, effective window, route binding, dan acknowledgement latency agar NOTAM lebih kuat sebagai data domain aviasi.', 'body'),
        ]),
        Section('Halaman 13 — Flight Safety Reporting', [
            p('Halaman safety reporting digunakan untuk submit hazard, near-miss, atau incident. Form berisi judul, tipe laporan, dan opsi anonymous. Validasi minimum menjaga kualitas laporan agar tidak terlalu pendek atau kosong.', 'body'),
            p('Daftar incident menampilkan badge type, status workflow, dan anonimitas. Seed data menyediakan status New, Reviewed, Actioned, dan Closed. Data ini kemudian dimanfaatkan dashboard readiness untuk menghitung safety posture dan daftar alert yang belum masuk corrective workflow.', 'body'),
            table('Tabel 12. Nilai operasional safety reporting', ['Aspek', 'Nilai'], [
                ['Anonymous option', 'Mendorong budaya pelaporan tanpa takut'],
                ['Type separation', 'Membedakan hazard, near-miss, incident'],
                ['Workflow status', 'Membuka jalan ke triage dan corrective action'],
                ['Search integration', 'Memudahkan review cepat dari topbar'],
                ['Audit trail', 'Pencatatan create/update di reducer'],
            ]),
            p('Sebagai MVP, modul ini sudah cukup untuk membangun reporting culture. Untuk produksi, ia perlu attachment, owner assignment, SLA, evidence list, root cause, dan closure verification.', 'body'),
        ]),
        Section('Halaman 14 — Medical Readiness', [
            p('Medical readiness page menjadi jembatan antara domain operasi dan domain kesehatan. Walaupun implementasinya tidak sepenuhnya dicetak dalam dokumen ini, halaman tersebut menyimpan beberapa form local state untuk medication, vaccination, fatigue, mental check-in, physical fitness, dan exposure, serta mengikatnya ke pilot terpilih.', 'body'),
            p('Dari perspektif produk, modul ini menunjukkan arah aplikasi menuju aeromedical platform. Alih-alih hanya menyimpan status Active/Limited/Grounded pada pilot profile, aplikasi mulai menyiapkan struktur agar faktor medication restriction, post-vaccine window, fatigue-sleep, mental readiness, antropometri, dan occupational exposure masuk ke readiness equation.', 'body'),
            table('Tabel 13. Domain medical yang sudah tersirat di codebase', ['Domain', 'Contoh Mekanisme'], [
                ['Medication restriction', 'Obat dan rule grounding'],
                ['Vaccination monitoring', 'Window pasca-vaksin dengan alert'],
                ['Fatigue & sleep', 'Monitoring rest, sleep debt, circadian'],
                ['Mental readiness', 'Screening kesiapan mental rahasia'],
                ['Physical fitness', 'BMI, tekanan darah, tes kebugaran'],
                ['Occupational health', 'Paparan kebisingan, panas, chemical'],
            ]),
            p('Dengan menghubungkan domain medical ke command dashboard, platform berpotensi menjadi sistem fit-to-fly yang jauh lebih kaya daripada status statis biasa.', 'body'),
        ]),
        Section('Halaman 15 — Modul Rikkes TNI AU', [
            p('Modul Rikkes adalah komponen data kesehatan paling detail di codebase. Record Rikkes memuat identitas peserta, anamnesis, tanda vital, pemeriksaan fisik, laboratorium, radiologi, mata, THT, gigi, jiwa, kesimpulan, saran, kategori kesehatan, status fit, masa berlaku, serta cap waktu created/updated.', 'body'),
            p('Halaman list menampilkan summary cards total pemeriksaan, kategori kesehatan, fit-to-fly, restriction, dan expiring soon. Halaman detail menampilkan seluruh blok pemeriksaan, badge kategori/status, pembatasan, serta preview dan download PDF hasil pemeriksaan. Ini adalah implementasi yang paling kaya secara data schema di antara seluruh modul.', 'body'),
            table('Tabel 14. Struktur record Rikkes', ['Kelompok', 'Contoh Isi'], [
                ['Identitas', 'NRP, nama, pangkat, korps, satuan, umur'],
                ['Vital signs', 'TB, BB, BMI, tekanan darah, nadi, SpO2'],
                ['Laboratorium', 'Hb, leukosit, glukosa, lipid, ureum, kreatinin'],
                ['Mata/THT/Gigi', 'Visus, audiometri, DMF, maloklusi'],
                ['Jiwa', 'Mood, afek, insight, hasil test'],
                ['Kesimpulan', 'Fit / restriction / unfit + saran'],
            ]),
            p('Modul ini memberi dasar kuat untuk integrasi aeromedical readiness. Jika dikaitkan ke dashboard dan assignment engine, keputusan go/no-go dapat menjadi jauh lebih presisi.', 'body'),
        ]),
        Section('Halaman 16 — Reports & Analytics', [
            p('Halaman reports menyajikan snapshot readiness score, daftar komponen readiness, active alerts, mock chart jam terbang bulanan, serta tiga mekanisme ekspor: CSV logbook, CSV breakdown readiness, dan PDF sederhana berisi beberapa metrik inti.', 'body'),
            p('Walau ekspor PDF saat ini masih berupa Blob text dengan MIME application/pdf sederhana, pola pemanggilan ekspor sudah ada dan dapat ditingkatkan. Halaman reports sangat penting sebagai jembatan dari sistem operasional harian ke kebutuhan briefing, evaluasi, dan dokumentasi komando.', 'body'),
            table('Tabel 15. Artefak ekspor yang tersedia', ['Ekspor', 'Isi'], [
                ['logbook.csv', '20 baris logbook terbaru'],
                ['readiness-breakdown.csv', 'Komponen score, weight, note'],
                ['Aircrew Report.pdf', 'Ringkasan readiness, incident, training, alerts'],
            ]),
            p('Ke depan, reports bisa diperluas dengan template komando, tanda tangan digital internal, PDF layout penuh, distribusi email, dan snapshot historis per minggu/bulan.', 'body'),
        ]),
        Section('Halaman 17 — Admin Panel dan master data', [
            p('Admin panel memusatkan CRUD master data aircraft, bases, dan sorties. Data ini disimpan ke localStorage tersendiri dan digunakan lintas modul seperti logbook dan schedule. Adanya reset master data juga memudahkan demo atau pemulihan konfigurasi default.', 'body'),
            p('Halaman ini juga menampilkan tabel permissionRows sebagai ringkasan akses role. Meskipun aturan sesungguhnya ada di util RBAC, tampilan admin membantu menjelaskan model hak akses ke pengguna non-teknis.', 'body'),
            table('Tabel 16. Master data yang dikelola', ['Master', 'Dipakai Oleh', 'Manfaat'], [
                ['Aircraft', 'Logbook, schedule, modul terkait armada', 'Konsistensi input tail number'],
                ['Bases', 'Schedule, planning', 'Standarisasi lokasi operasi'],
                ['Sorties', 'Logbook dan perencanaan', 'Standarisasi jenis misi'],
            ]),
            p('Desain ini membuktikan codebase tidak hanya fokus pada domain record, tetapi juga memikirkan governance referensi data kecil yang memengaruhi konsistensi seluruh aplikasi.', 'body'),
        ]),
        Section('Halaman 18 — Generic feature engine', [
            p('GenericFeaturePage adalah mesin modular yang sangat penting. Halaman ini membaca metadata route, blueprint workflow, schema CRUD, dan storage key untuk membangun daftar task, records, filter status, pencarian, export CSV, export PDF command brief, export JSON snapshot, import payload, serta reset modul.', 'body'),
            p('Dengan pendekatan ini, banyak permintaan fitur baru dapat diwujudkan sebagai kombinasi metadata dan schema tanpa menulis halaman bespoke. Generic engine juga menghitung progress workflow, open task count, open record count, dan module health score, sehingga setiap modul tambahan langsung memiliki pola kerja yang seragam.', 'body'),
            table('Tabel 17. Kemampuan generic engine', ['Kemampuan', 'Keterangan'], [
                ['Checklist workflow', 'Task list dengan owner dan status done'],
                ['CRUD records', 'Form field dinamis berdasarkan schema'],
                ['Filter + search', 'Penyaringan status dan pencarian isi'],
                ['Export/import', 'CSV, PDF command brief, JSON snapshot'],
                ['Sync summary', 'Ringkasan progres lintas modul'],
            ]),
            p('Bagi pengembangan ke depan, generic engine ini adalah akselerator utama. Ia memungkinkan backlog besar tetap terstruktur dan konsisten secara UX.', 'body'),
        ]),
        Section('Halaman 19 — Peta fitur: Medical & Aeromedical', [
            p('Kelompok fitur Medical & Aeromedical dalam requestedFeatureModules mencakup Profil Medis Aircrew, Medical Validity Management, Medication & Restriction Tracker, Vaccination Window, Fatigue & Sleep Monitoring, Mental Readiness Check-in, Physical Fitness & Anthropometry, serta Exposure / Occupational Health.', 'body'),
            p('Secara produk, delapan modul ini memperluas pandangan fit-to-fly dari sekadar status biner menjadi spektrum faktor klinis, psikologis, fisiologis, dan okupasional. Ini sangat penting jika organisasi ingin membangun keputusan readiness yang lebih ilmiah dan preventif.', 'body'),
            table('Tabel 18. Fitur Medical & Aeromedical', ['Modul', 'Fungsi Utama'], [
                ['Profil Medis Aircrew', 'Kelas medical, waiver, riwayat pemeriksaan'],
                ['Medical Validity', 'Pantau masa berlaku dan fit/unfit'],
                ['Medication & Restriction', 'Catat obat dan rule grounding'],
                ['Vaccination Window', 'Alert 48-72 jam pasca-vaksin'],
                ['Fatigue & Sleep', 'Pantau duty/rest dan sleep debt'],
                ['Mental Readiness', 'Skrining kesiapan mental rahasia'],
                ['Physical Fitness', 'BMI, tensi, VO2, body composition'],
                ['Occupational Health', 'Paparan kebisingan/chemical/heat'],
            ]),
            p('Semua modul ini saat ini digerakkan melalui generic engine dan blueprint, namun arah fungsionalnya sudah jelas serta sangat relevan untuk platform aeromedical.', 'body'),
        ]),
        Section('Halaman 20 — Peta fitur: Training & Currency', [
            p('Kelompok Training & Currency berisi Training Tracker Detail, Training Expiry Forecast, Currency Status Engine, Qualification Matrix, dan Learning Record & Evidence Upload. Meski core page training sudah ada, modul-modul ini memperluas analitik dan pembuktian kompetensi.', 'body'),
            p('Kombinasi core training page dan requested modules menunjukkan dua horizon. Horizon pertama adalah operasi harian: expiry dan compliance. Horizon kedua adalah knowledge management: syllabus detail, qualification matrix lintas role, evidence upload, serta prediksi expiry 30/60/90 hari untuk komando.', 'body'),
            table('Tabel 19. Fitur Training & Currency', ['Modul', 'Nilai Tambah'], [
                ['Training Tracker Detail', 'Detail syllabus dan jam simulator'],
                ['Training Expiry Forecast', 'Prioritas expiry 30/60/90 hari'],
                ['Currency Status Engine', 'Night, instrument, formation, low level'],
                ['Qualification Matrix', 'Matriks role vs aircraft type'],
                ['Learning Record', 'Bukti sertifikat dan evidence training'],
            ]),
            p('Bila data training ini dikaitkan lebih jauh dengan insiden dan sortie performance, aplikasi dapat berkembang menjadi adaptive training planner yang benar-benar berbasis bukti.', 'body'),
        ]),
        Section('Halaman 21 — Peta fitur: Flight Ops & Logbook', [
            p('Kelompok Flight Ops & Logbook memuat E-Logbook Terintegrasi, Sortie Planning & Crew Assignment, Post-Flight Medical Debrief, Physio Event Reporting, dan Aircraft Availability Link. Sebagian sudah diwujudkan dalam core page logbook dan schedule, sementara sisanya memberi ruang untuk integrasi pasca-terbang dan status armada.', 'body'),
            p('Fitur post-flight medical debrief dan physio event reporting akan sangat berguna untuk menjembatani operasi dan kesehatan. Dengan menyatukan sortie, gejala pascamisi, dan event fisiologis seperti G-force/hypoxia, organisasi dapat membangun dataset aeromedical yang jauh lebih kaya.', 'body'),
            table('Tabel 20. Fitur Flight Ops & Logbook', ['Modul', 'Peran'], [
                ['E-Logbook Terintegrasi', 'Rekaman sortie, jam, event, remark'],
                ['Sortie Planning', 'Crew assignment + conflict detection'],
                ['Post-Flight Medical', 'Checklist gejala pasca misi'],
                ['Physio Event Reporting', 'Laporan G-LOC, hypoxia, barotrauma'],
                ['Aircraft Availability Link', 'Tail number dan maintenance flag'],
            ]),
            p('Kelompok ini adalah tulang punggung operasi. Jika diintegrasikan dengan maintenance dan medical, ia dapat memetakan readiness dari sisi manusia dan platform sekaligus.', 'body'),
        ]),
        Section('Halaman 22 — Peta fitur: Risk & Safety (ORM)', [
            p('Kelompok Risk & Safety mencakup ORM Builder, Risk Register & Mitigation Tracking, Incident Workflow, Trend Safety Analytics, dan Early Warning Alerts. Di codebase saat ini sudah ada ORM core page dan safety reporting; requested modules menambahkan governance mitigasi, analitik tren, dan alert dini.', 'body'),
            p('Trend safety analytics penting untuk mengubah safety dari reaktif menjadi proaktif. Incident rate per 100 sorties, heatmap risiko, dan risk register yang menyimpan PIC, due date, serta evidence akan membuat safety menjadi domain manajemen, bukan sekadar pelaporan.', 'body'),
            table('Tabel 21. Fitur Risk & Safety', ['Modul', 'Fungsi'], [
                ['ORM Builder', 'Template risiko pra-misi'],
                ['Risk Register', 'Lacak PIC, due date, evidence mitigasi'],
                ['Incident Workflow', 'Submit -> review -> close'],
                ['Safety Trend Analytics', 'Incident rate dan heatmap risiko'],
                ['Early Warning Alerts', 'Alert training expiry, medical expiry, high risk'],
            ]),
            p('Dikombinasikan dengan dokumen predictive safety engine di folder docs, kelompok ini membuka jalan ke safety intelligence yang explainable.', 'body'),
        ]),
        Section('Halaman 23 — Peta fitur: Command & Readiness Analytics', [
            p('Kelompok Command & Readiness Analytics memuat Unified Readiness Score Model, Mission State Rules, Readiness Drill-Down, Priority Actions Dashboard, Export Laporan, Audit Log Viewer, dan Role-Based Access. Inilah kumpulan fitur yang paling berorientasi pada komando.', 'body'),
            p('Sudah ada sebagian implementasi pada dashboard, reports, audit logs reducer, dan util RBAC. Sisanya dapat diwujudkan bertahap melalui generic modules atau halaman komando khusus. Secara konsep, kelompok ini mengubah data operasional menjadi prioritas tindakan nyata.', 'body'),
            img(assets['feature_distribution'], 'Grafik 2. Distribusi jumlah requested feature module per kelompok besar.', 960, 611),
            table('Tabel 22. Fitur command analytics', ['Modul', 'Nilai'], [
                ['Readiness Score Model', 'Skor terpadu 0-100'],
                ['Mission State Rules', 'RED/AMBER/GREEN otomatis'],
                ['Readiness Drill-Down', 'Unit -> squadron -> individual'],
                ['Priority Actions', 'Queue tugas prioritas'],
                ['Export Laporan', 'Output PDF/Excel komando'],
                ['Audit Log Viewer', 'Jejak perubahan'],
                ['Role-Based Access', 'Kontrol akses route dan aksi'],
            ]),
        ]),
        Section('Halaman 24 — Mission Lifecycle Board', [
            p('MissionLifecyclePage membentuk alur end-to-end pre-brief sampai closed mission. Setiap mission record memuat title, mission type, base, assigned pilot, schedule, stage, objective, risk summary, go/no-go decision, action owner, evidence count, dan daftar approvals dengan dueHours.', 'body'),
            p('Halaman ini menampilkan overview mission aktif, pending go/no-go, approval overdue, lalu card detail tiap misi dengan ringkasan risiko, jumlah evidence, pending approval, dan aksi untuk mengubah tahap atau keputusan. Audit log juga ditulis saat misi baru dibuat.', 'body'),
            img(assets['mission_workflow'], 'Gambar 3. Alur mission lifecycle dari draft hingga closure, menekankan approval dan evidence.', 980, 343),
            table('Tabel 23. Manfaat Mission Lifecycle Board', ['Aspek', 'Manfaat'], [
                ['Stage machine', 'Status misi mudah dipantau'],
                ['Approval SLA', 'Keputusan yang terlambat dapat diidentifikasi'],
                ['Evidence count', 'Mendorong kelengkapan dokumen'],
                ['Go/No-Go badge', 'Keputusan cepat terlihat'],
                ['Action owner', 'Kejelasan penanggung jawab'],
            ]),
            p('Bila digabungkan dengan dashboard, board ini berpotensi menjadi tulang punggung command workflow digital.', 'body'),
        ]),
        Section('Halaman 25 — RBAC dan governance akses', [
            p('Sistem RBAC dibangun pada dua tingkat: akses route dan akses aksi. Util hasRouteAccess, hasRouteWriteAccess, dan hasActionAccess memetakan lima role terhadap core routes maupun requested modules per grup. Reducer memanggil hasActionAccess untuk mencegah penulisan data oleh role yang tidak berhak, lalu mencatat access denied ke audit log.', 'body'),
            p('Model ini sederhana tetapi efektif. Ia memastikan Pilot tidak bisa mengubah modul yang seharusnya milik Medical atau Commander/Admin, sementara Ops Officer dan FSO mendapatkan domain masing-masing. Bagi aplikasi operasional, kontrol seperti ini penting untuk menjaga segregasi tugas dan akuntabilitas.', 'body'),
            table('Tabel 24. Contoh hak akses aksi', ['Aksi', 'Role yang Diizinkan'], [
                ['ADD_LOGBOOK', 'Pilot, Ops Officer, Commander/Admin'],
                ['ADD_SCHEDULE', 'Ops Officer, Commander/Admin'],
                ['ADD_ORM', 'Flight Safety Officer, Ops Officer, Commander/Admin'],
                ['ADD_TRAINING', 'Ops Officer, Commander/Admin'],
                ['ADD_INCIDENT', 'Pilot, Flight Safety Officer, Commander/Admin'],
                ['ACK_NOTAM', 'Pilot, Ops Officer, Commander/Admin'],
                ['MEDICAL_WRITE', 'Medical, Commander/Admin'],
                ['ADMIN_WRITE', 'Commander/Admin'],
            ]),
            p('Ke depan, model akses ini dapat ditingkatkan dengan user identity nyata, unit scope, approval delegation, dan audit reason mandatory untuk aksi tertentu.', 'body'),
        ]),
        Section('Halaman 26 — Data dictionary ringkas', [
            p('Codebase memiliki dua kumpulan data utama: state operasional umum dan Rikkes medical record. Seed data operasional saat ini mencakup 4 profil pilot, 80 logbook entries, 30 schedule items, 16 NOTAM, 10 training items, 14 incident records, 2 ORM records, 2 notifications, 2 audit logs, 2 messages, dan sekumpulan record Rikkes yang lebih detail.', 'body'),
            p('Pemisahan antara data ringkas untuk operasi harian dan data klinis mendetail untuk Rikkes adalah keputusan desain yang baik. Ia menghindari dashboard menjadi terlalu berat, namun tetap memberi jalan untuk drill-down ke domain medis ketika dibutuhkan.', 'body'),
            img(assets['seed_volume'], 'Grafik 3. Komposisi volume seed data per domain aplikasi.', 980, 572),
            table('Tabel 25. Dictionary ringkas entitas utama', ['Entitas', 'Kunci Penting', 'Keterangan'], [
                ['PilotProfile', 'id, wing, ratings, currency, status', 'Profil aircrew operasional'],
                ['TrainingItem', 'pilotId, type, expiryDate, status', 'Kepatuhan currency'],
                ['Incident', 'title, type, status, anonymous', 'Safety event'],
                ['OrmAssessment', 'crewRestHours, weather, riskLevel', 'Risiko misi'],
                ['RikkesRecord', 'identitas, vital, lab, status', 'Pemeriksaan medis detail'],
            ]),
        ]),
        Section('Halaman 27 — Formula readiness score dan alert engine', [
            p('Readiness engine menghitung tujuh komponen: Medical Readiness, Training Currency, Operational Risk, Safety Posture, NOTAM Compliance, Maintenance Availability, dan Fatigue Exposure. Setiap komponen dinormalisasi ke skor 20-100 lalu diberi bobot adaptif berdasarkan mission profile Training, Routine Ops, atau High-Risk Ops.', 'body'),
            p('Komponen training mempertimbangkan expiring dan expired item; komponen risk melihat jumlah ORM high/medium; komponen safety menghitung incident open/reviewed; komponen NOTAM menghitung backlog acknowledge; komponen maintenance menurunkan skor saat aircraft PMC/NMC; komponen fatigue memanfaatkan jam terbang tujuh hari dan night sortie. Hasil akhirnya adalah weighted sum yang dibulatkan dan di-clamp.', 'body'),
            table('Tabel 26. Bobot readiness per mission profile', ['Komponen', 'Training', 'Routine Ops', 'High-Risk Ops'], [
                ['Medical', '0.22', '0.23', '0.20'],
                ['Training', '0.26', '0.20', '0.18'],
                ['Risk', '0.12', '0.16', '0.22'],
                ['Safety', '0.12', '0.12', '0.12'],
                ['NOTAM', '0.10', '0.08', '0.06'],
                ['Maintenance', '0.08', '0.11', '0.12'],
                ['Fatigue', '0.10', '0.10', '0.10'],
            ]),
            p('Alert engine kemudian membentuk daftar alert untuk training expired/expiring, limited crew status, ORM high, open incidents, NOTAM pending, aircraft NMC, dan fatigue hours. Desain ini membuat skor tetap explainable karena penyebabnya selalu dapat dilihat.', 'body'),
        ]),
        Section('Halaman 28 — Predictive safety engine dan URS roadmap', [
            p('Folder docs juga memuat rancangan Predictive Safety Engine dan Unified Readiness Score. Dokumen-dokumen tersebut menunjukkan arah evolusi platform dari sistem mock-first menjadi decision-support system yang memadukan logbook, ORM, fatigue, NOTAM exposure, medical, training currency, dan maintenance dalam model skoring serta alert yang lebih matang.', 'body'),
            p('Predictive Safety Engine menekankan rule-based explainability: fatigue + tempo exposure, ORM without mitigation, NOTAM complexity overload, dan combined escalation trigger. Unified Readiness Score menambahkan level personel, kru, dan skuadron, bobot adaptif per misi, command override, ambang status, serta desain dashboard komando yang lebih kaya.', 'body'),
            table('Tabel 27. Arah pengembangan roadmap analitik', ['Roadmap', 'Fokus'], [
                ['Phase 0', 'Data readiness dan contract lintas modul'],
                ['Phase 1', 'Rule engine MVP + scoring + reason code'],
                ['Phase 2', 'Validation, backtest, shadow mode, tuning'],
                ['Phase 3', 'Hybrid statistical / ML model'],
                ['Governance', 'Audit, override, feature snapshot, SLA'],
            ]),
            p('Roadmap ini sangat relevan terhadap codebase saat ini karena sebagian besar data dasarnya sudah ada, meskipun masih lokal dan mock. Dengan backend dan governance yang tepat, transisi ke analitik lanjutan cukup realistis.', 'body'),
        ]),
        Section('Halaman 29 — Kekuatan, keterbatasan, dan gap', [
            p('Kekuatan platform: cakupan modul luas, generic feature engine kuat, state dan route cukup rapi, readiness engine explainable, modul Rikkes kaya data, serta adanya mission board yang sudah memodelkan approval dan go/no-go. Secara demonstrasi produk, platform ini sangat kuat untuk menunjukkan visi operasi digital terpadu.', 'body'),
            p('Keterbatasan utama: belum ada backend atau autentikasi nyata, data hanya lokal per browser, belum ada sinkronisasi multi-user, ekspor PDF masih sederhana, belum ada upload attachment sesungguhnya, dan belum ada keamanan data klinis tingkat produksi. Selain itu, beberapa modul roadmap masih berupa generic page atau blueprint, belum berupa workflow spesifik yang mendalam.', 'body'),
            table('Tabel 28. Gap paling penting menuju produksi', ['Gap', 'Dampak', 'Prioritas'], [
                ['Backend & multi-user', 'Data tidak tersentralisasi', 'Sangat tinggi'],
                ['Identity & auth', 'Role masih mock', 'Sangat tinggi'],
                ['Data governance', 'Audit dan privacy belum kuat', 'Sangat tinggi'],
                ['Attachment/evidence', 'Workflow investigasi terbatas', 'Tinggi'],
                ['Operational integration', 'Belum tersambung ke sistem armada/medis', 'Tinggi'],
                ['Observability & testing', 'Reliabilitas produksi belum terukur', 'Menengah'],
            ]),
            p('Walaupun ada gap, baseline codebase sudah matang untuk dipakai sebagai landasan fase discovery, pilot internal, atau prototipe integrasi komando.', 'body'),
        ]),
        Section('Halaman 30 — Rekomendasi implementasi dan penutup', [
            p('Rekomendasi implementasi disusun bertahap. Tahap pertama adalah menghubungkan state penting ke backend: profiles, training, logbook, NOTAM, incidents, ORM, schedule, dan audit logs. Tahap kedua adalah menerapkan identity dan unit scope. Tahap ketiga adalah menguatkan mission board, evidence, dan approval chain. Tahap keempat adalah mengintegrasikan domain medical/Rikkes dengan guardrail kerahasiaan dan consent. Tahap kelima adalah men-deploy analytics lanjutan seperti predictive safety dan unified readiness di atas data yang sudah tervalidasi.', 'body'),
            p('Secara organisasi, platform ini paling ideal diposisikan sebagai cockpit digital untuk aircrew readiness. Nilai terbesarnya bukan hanya pada fitur individual, tetapi pada cara fitur-fitur tersebut saling memengaruhi: logbook memengaruhi fatigue, training memengaruhi fit-check, NOTAM memengaruhi compliance dan alert, incident memengaruhi safety posture, dan medical/Rikkes membuka jalan ke fit-to-fly berbasis bukti.', 'body'),
            p('Penutup: dokumen ini menyajikan paket dokumentasi 30 halaman yang dirancang untuk kebutuhan briefing, review produk, dan bahan komunikasi dengan stakeholder. Seluruh artefak dapat diregenerasi dari repository yang sama sehingga tetap mudah dipelihara ketika aplikasi berkembang.', 'body'),
            table('Tabel 29. Rekomendasi 90 hari', ['Rentang', 'Fokus Deliverable'], [
                ['0-30 hari', 'Backlog prioritas, backend schema, identity model'],
                ['31-60 hari', 'API integrasi, audit server, attachment evidence'],
                ['61-90 hari', 'Dashboards komando, readiness historis, pilot rollout'],
            ]),
            p('SELESAI.', 'heading2', 'center'),
        ]),
    ]


def run_properties(style: str) -> str:
    if style == 'title':
        return '<w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="123E8A"/></w:rPr>'
    if style == 'subtitle':
        return '<w:rPr><w:i/><w:sz w:val="24"/><w:color w:val="475569"/></w:rPr>'
    if style == 'heading1':
        return '<w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="123E8A"/></w:rPr>'
    if style == 'heading2':
        return '<w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="123E8A"/></w:rPr>'
    return '<w:rPr><w:sz w:val="22"/></w:rPr>'


def paragraph_xml(par: Paragraph) -> str:
    align_map = {'left': 'left', 'center': 'center', 'right': 'right', 'justify': 'both'}
    text = escape(par.text)
    props = ['<w:spacing w:after="140"/>']
    if par.page_break_before:
        props.append('<w:pageBreakBefore/>')
    if par.keep_with_next:
        props.append('<w:keepNext/>')
    props.append(f'<w:jc w:val="{align_map.get(par.align, "left")}"/>')
    return (
        f'<w:p><w:pPr>{"".join(props)}</w:pPr>'
        f'<w:r>{run_properties(par.style)}<w:t xml:space="preserve">{text}</w:t></w:r></w:p>'
    )


def page_break_xml() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def table_xml(block: TableBlock) -> str:
    widths = block.widths or [int(TABLE_WIDTH_DXA / len(block.headers))] * len(block.headers)
    grid = ''.join(f'<w:gridCol w:w="{width}"/>' for width in widths)

    def cell(text: str, width: int, header: bool = False) -> str:
        shading = '<w:shd w:fill="DCEBFA"/>' if header else ''
        rp = '<w:rPr><w:b/><w:sz w:val="21"/></w:rPr>' if header else '<w:rPr><w:sz w:val="20"/></w:rPr>'
        return (
            f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{shading}</w:tcPr>'
            f'<w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r>{rp}<w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p></w:tc>'
        )

    header_row = '<w:tr>' + ''.join(cell(text, widths[i], True) for i, text in enumerate(block.headers)) + '</w:tr>'
    rows = [header_row]
    for row in block.rows:
        rows.append('<w:tr>' + ''.join(cell(text, widths[i], False) for i, text in enumerate(row)) + '</w:tr>')
    tbl = (
        '<w:tbl>'
        '<w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>'
        '<w:top w:val="single" w:sz="8" w:space="0" w:color="9CA3AF"/>'
        '<w:left w:val="single" w:sz="8" w:space="0" w:color="9CA3AF"/>'
        '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="9CA3AF"/>'
        '<w:right w:val="single" w:sz="8" w:space="0" w:color="9CA3AF"/>'
        '<w:insideH w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>'
        '<w:insideV w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>'
        '</w:tblBorders></w:tblPr>'
        f'<w:tblGrid>{grid}</w:tblGrid>'
        + ''.join(rows) + '</w:tbl>'
    )
    title_xml = paragraph_xml(Paragraph(block.title, style='heading2')) if block.title else ''
    return title_xml + tbl


def image_xml(block: ImageBlock, rel_id: str, doc_pr_id: int) -> str:
    cx = block.width_px * PX_TO_EMU
    cy = block.height_px * PX_TO_EMU
    return f'''
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="80"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="{cx}" cy="{cy}"/>
            <wp:docPr id="{doc_pr_id}" name="Picture {doc_pr_id}"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="{escape(block.path.name)}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="{rel_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    ''' + paragraph_xml(Paragraph(block.caption, style='subtitle', align='center'))


def build_document_xml(sections: list[Section], rel_map: dict[str, str]) -> str:
    body_parts: list[str] = []
    image_counter = 1
    for index, section in enumerate(sections):
        if index > 0:
            body_parts.append(page_break_xml())
        body_parts.append(paragraph_xml(Paragraph(section.title, style='heading1')))
        for item in section.body:
            if isinstance(item, Paragraph):
                body_parts.append(paragraph_xml(item))
            elif isinstance(item, TableBlock):
                body_parts.append(table_xml(item))
            elif isinstance(item, ImageBlock):
                body_parts.append(image_xml(item, rel_map[item.path.name], image_counter))
                image_counter += 1
            else:
                raise TypeError(f'Unsupported block type: {type(item)!r}')
    body_parts.append(
        '<w:sectPr>'
        '<w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="850" w:header="708" w:footer="708" w:gutter="0"/>'
        '</w:sectPr>'
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
 xmlns:v="urn:schemas-microsoft-com:vml"
 xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:w10="urn:schemas-microsoft-com:office:word"
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
 xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
 xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
 xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
 xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
 mc:Ignorable="w14 wp14">
  <w:body>{''.join(body_parts)}</w:body>
</w:document>'''


def build_styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
</w:styles>'''


def build_content_types(image_names: Iterable[str]) -> str:
    overrides = ''.join(f'<Default Extension="png" ContentType="image/png"/>' if any(True for _ in image_names) else '')
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  {overrides}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>'''


def build_root_rels() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''


def build_document_rels(image_names: list[str]) -> tuple[str, dict[str, str]]:
    rels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    ]
    rel_map: dict[str, str] = {}
    rid = 2
    for name in image_names:
        rel_id = f'rId{rid}'
        rel_map[name] = rel_id
        rels.append(
            f'<Relationship Id="{rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{name}"/>'
        )
        rid += 1
    xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ''.join(rels) + '</Relationships>'
    return xml, rel_map


def build_manifest_md(sections: list[Section], assets: dict[str, Path]) -> str:
    lines = [
        '# Paket Dokumentasi DOCX Aircrew Platform',
        '',
        f'- Output utama (artefak lokal, tidak dikomit): `{OUTPUT_DOCX.relative_to(ROOT)}`.',
        '- Generator bersifat regenerable dan menggunakan Python standard library saja.',
        '- Dokumen ditargetkan menjadi 30 halaman dengan page break eksplisit, tabel, serta beberapa gambar/grafik.',
        '',
        '## Daftar bagian',
        '',
    ]
    for idx, section in enumerate(sections, start=1):
        lines.append(f'{idx}. {section.title}')
    lines.extend([
        '',
        '## Aset visual yang disematkan',
        '',
        f'- `{assets["architecture"].relative_to(ROOT)}` — diagram lapisan arsitektur.',
        f'- `{assets["feature_distribution"].relative_to(ROOT)}` — grafik distribusi feature group.',
        f'- `{assets["seed_volume"].relative_to(ROOT)}` — grafik volume seed dataset.',
        f'- `{assets["mission_workflow"].relative_to(ROOT)}` — diagram mission lifecycle workflow.',
        '',
        '## Cara regenerasi',
        '',
        '```bash',
        'python docs/generate_aircrew_platform_docx.py',
        '```',
    ])
    return '\n'.join(lines) + '\n'


def main() -> None:
    assets = build_assets()
    sections = build_sections(assets)
    image_names = [path.name for path in assets.values()]
    document_rels, rel_map = build_document_rels(image_names)
    document_xml = build_document_xml(sections, rel_map)

    with ZipFile(OUTPUT_DOCX, 'w', compression=ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', build_content_types(image_names))
        zf.writestr('_rels/.rels', build_root_rels())
        zf.writestr('word/document.xml', document_xml)
        zf.writestr('word/styles.xml', build_styles_xml())
        zf.writestr('word/_rels/document.xml.rels', document_rels)
        for asset in assets.values():
            zf.write(asset, f'word/media/{asset.name}')

    manifest = DOCS_DIR / 'aircrew-platform-docx-manifest.md'
    manifest.write_text(build_manifest_md(sections, assets), encoding='utf-8')

    print(f'Generated {OUTPUT_DOCX.relative_to(ROOT)}')
    print(f'Generated {manifest.relative_to(ROOT)}')
    print(f'Total sections/pages: {len(sections)}')


if __name__ == '__main__':
    main()

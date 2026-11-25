/**
 * Excel import/export helpers for prizes (client-side, via SheetJS/xlsx).
 *
 * Template columns (row 1 = headers):
 *   Nama | Tier | Jumlah | Nilai | Mata Uang | URL Gambar | Sponsor | Deskripsi
 *
 * Only "Nama" is required. "Tier" defaults to "doorprize" when blank.
 */
import * as XLSX from 'xlsx';
import type { CreatePrizePayload } from '@/api/prize';

export const PRIZE_TIERS = [
  'doorprize',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'grand',
] as const;

export type PrizeTier = (typeof PRIZE_TIERS)[number];

const HEADERS = [
  'Nama',
  'Tier',
  'Jumlah',
  'Nilai',
  'Mata Uang',
  'URL Gambar',
  'Sponsor',
  'Deskripsi',
] as const;

export interface PrizeImportResult {
  rows: CreatePrizePayload[];
  errors: string[];
}

function norm(v: unknown): string {
  return (v == null ? '' : String(v)).trim();
}

function toInt(v: unknown, fallback: number): number {
  const n = Math.floor(Number(norm(v).replace(/[^\d.-]/g, '')));
  return Number.isFinite(n) ? n : fallback;
}

function toNum(v: unknown, fallback: number): number {
  const n = Number(norm(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

/** Parse an Excel/CSV file into prize create payloads. */
export async function parsePrizesFromExcel(file: File): Promise<PrizeImportResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], errors: ['File kosong atau format tidak dikenali.'] };
  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (aoa.length < 2) return { rows: [], errors: ['Tidak ada baris data (baris pertama = header).'] };

  const headerRow = (aoa[0] as unknown[]).map(norm);
  const col = (aliases: string[]): number =>
    headerRow.findIndex((h) => aliases.some((a) => h.toLowerCase() === a.toLowerCase()));

  const idx = {
    name: col(['Nama', 'Name', 'Nama Hadiah']),
    tier: col(['Tier', 'Tingkat']),
    quantity: col(['Jumlah', 'Quantity', 'Stok', 'Qty']),
    value: col(['Nilai', 'Value', 'Harga']),
    currency: col(['Mata Uang', 'Currency']),
    imageUrl: col(['URL Gambar', 'Image Url', 'Image', 'Gambar', 'ImageUrl']),
    sponsor: col(['Sponsor']),
    description: col(['Deskripsi', 'Description']),
  };

  if (idx.name < 0) {
    return { rows: [], errors: ['Kolom "Nama" tidak ditemukan. Gunakan template yang disediakan.'] };
  }

  const rows: CreatePrizePayload[] = [];
  const errors: string[] = [];

  for (let r = 1; r < aoa.length; r++) {
    const cells = aoa[r] as unknown[];
    const line = r + 1;
    const name = norm(cells[idx.name]);
    if (!name) continue; // skip empty rows

    const tierRaw = idx.tier >= 0 ? norm(cells[idx.tier]).toLowerCase() : '';
    const tier = (tierRaw || 'doorprize') as PrizeTier;
    if (!(PRIZE_TIERS as readonly string[]).includes(tier)) {
      errors.push(`Baris ${line}: tier "${tierRaw}" tidak valid (pilihan: ${PRIZE_TIERS.join(', ')}).`);
      continue;
    }

    const quantity = toInt(idx.quantity >= 0 ? cells[idx.quantity] : '', NaN);
    if (!Number.isFinite(quantity) || quantity < 1) {
      errors.push(`Baris ${line}: jumlah harus angka >= 1.`);
      continue;
    }

    const value = toNum(idx.value >= 0 ? cells[idx.value] : '', 0);
    const currency = idx.currency >= 0 ? norm(cells[idx.currency]) : '';
    const imageUrl = idx.imageUrl >= 0 ? norm(cells[idx.imageUrl]) : '';
    const sponsor = idx.sponsor >= 0 ? norm(cells[idx.sponsor]) : '';
    const description = idx.description >= 0 ? norm(cells[idx.description]) : '';

    const payload: CreatePrizePayload = {
      name,
      tier,
      quantity,
      value,
      description,
    };
    if (currency) payload.currency = currency;
    if (imageUrl) payload.imageUrl = imageUrl;
    if (sponsor) payload.sponsor = sponsor;

    rows.push(payload);
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('Tidak ada data valid untuk diimpor.');
  }
  return { rows, errors };
}

/** Download an .xlsx template pre-filled with headers and example rows. */
export function downloadPrizeTemplate(): void {
  const exampleRows: string[][] = [
    HEADERS as unknown as string[],
    ['Kulkas 2 Pintu', 'grand', '1', '5000000', 'IDR', 'https://contoh.com/gambar.jpg', 'Radiant', 'H hadiah utama'],
    ['Voucher Belanja', 'silver', '10', '250000', 'IDR', '', '', 'Voucher 250rb'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(exampleRows);
  ws['!cols'] = HEADERS.map((_, i) => ({ wch: i === 0 ? 24 : i === 5 ? 40 : 16 }));

  const guide = XLSX.utils.aoa_to_sheet([
    ['Petunjuk Import Hadiah'],
    ['1. Isi baris data di bawah header (baris 1).'],
    ['2. Kolom Nama wajib diisi.'],
    ['3. Tier (opsional): ' + PRIZE_TIERS.join(', ') + ' (kosong = doorprize).'],
    ['4. Jumlah wajib angka >= 1.'],
    ['5. Nilai & Mata Uang opsional (mis. 5000000 dan IDR).'],
    ['6. URL Gambar opsional (http/https atau link Google Drive).'],
    ['7. Sponsor & Deskripsi opsional.'],
    ['8. Baris kosong akan dilewati.'],
  ]);
  guide['!cols'] = [{ wch: 90 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hadiah');
  XLSX.utils.book_append_sheet(wb, guide, 'Petunjuk');
  XLSX.writeFile(wb, 'template-import-hadiah.xlsx');
}
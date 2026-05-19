import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually if it exists
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0]?.trim();
      const value = parts.slice(1).join('=').trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const IMPORT_USER_ID = process.env.IMPORT_USER_ID || '5754d355-35b2-43b6-bdb0-56af174d5065'; // Default fallback to user profile ID we found

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local or environment.');
  process.exit(1);
}
if (!IMPORT_USER_ID) {
  console.error('❌ Missing IMPORT_USER_ID. Set to the admin user UUID who owns these contacts.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const XLSX_PATH = path.resolve(__dirname, '../docs/MASTER DRYBONE.xlsx');

// ── Position Normalization Map ─────────────────────────────────────────────
const POSITION_MAP: Record<string, string> = {
  'chairman': 'Chairman', 'chairperson': 'Chairman', 'chair': 'Chairman',
  'secretary': 'Secretary',
  'organizer': 'Organizer', 'organiser': 'Organizer',
  'women': 'Women Organizer', 'woman': 'Women Organizer',
  'w. org': 'Women Organizer', 'w. org.': 'Women Organizer',
  'women org': 'Women Organizer', 'women organizer': 'Women Organizer',
  'woman organizer': 'Women Organizer', 'women organiser': 'Women Organizer',
  'woman organiser': 'Women Organizer', "women's organiser": 'Women Organizer',
  "women's organizer": 'Women Organizer', 'organizer women': 'Women Organizer',
  'organiser women': 'Women Organizer', 'woman org': 'Women Organizer',
  'youth': 'Youth Organizer', 'y. org': 'Youth Organizer',
  'youth org': 'Youth Organizer', 'youth organizer': 'Youth Organizer',
  'youth organiser': 'Youth Organizer', 'organizer youth': 'Youth Organizer',
  'organiser youth': 'Youth Organizer',
  'comms': 'Communications Officer', 'comm': 'Communications Officer',
  'communication': 'Communications Officer', 'communications': 'Communications Officer',
  'comms officer': 'Communications Officer', 'communication officer': 'Communications Officer',
  'communications officer': 'Communications Officer', 'comminucation': 'Communications Officer',
  "communication's officer": 'Communications Officer', 'comm electoral': 'Communications Officer',
  'electoral': 'Electoral Affairs Officer', 'elections': 'Electoral Affairs Officer',
  'election': 'Electoral Affairs Officer', 'elrctions': 'Electoral Affairs Officer',
  'electoral officer': 'Electoral Affairs Officer', 'electorial officer': 'Electoral Affairs Officer',
  'electoral affairs': 'Electoral Affairs Officer', 'electoral affairs officer': 'Electoral Affairs Officer',
  'electoral affairs off.': 'Electoral Affairs Officer', 'electoral a': 'Electoral Affairs Officer',
  'affairs': 'Electoral Affairs Officer', 'affairs officer': 'Electoral Affairs Officer',
  'e. affairs': 'Electoral Affairs Officer', 'elctoral affairs': 'Electoral Affairs Officer',
  'electoral aff': 'Electoral Affairs Officer', 'woman affairs': 'Electoral Affairs Officer',
  'org': 'Organizer',
  'w. organizer': 'Women Organizer', 'w / organizer': 'Women Organizer',
  'women org.': 'Women Organizer', 'womens organiser': 'Women Organizer',
  'women prganizer': 'Women Organizer',
  'y. organizer': 'Youth Organizer', 'y. org.': 'Youth Organizer',
  'y org': 'Youth Organizer', 'y organizer': 'Youth Organizer',
  'y / organizer': 'Youth Organizer', 'youth org.': 'Youth Organizer',
  'comm.': 'Communications Officer', 'communications electoral': 'Communications Officer',
};

function normalizePosition(raw: string): string | null {
  if (!raw?.trim()) return null;
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return POSITION_MAP[cleaned] || null;
}

// ── Types ──────────────────────────────────────────────────────────────────
interface ContactRecord {
  user_id: string;
  name: string;
  phone: string | null;
  group_name: string;
  voter_id: string | null;
  position: string | null;
  polling_station: string | null;
  polling_station_code: string | null;
  sub_area: string;
  has_contact: boolean;
  has_voter_id: boolean;
}

interface ImportReport {
  total_imported: number;
  missing_contact: number;
  missing_voter_id: number;
  duplicated_station_codes: string[];
  positions_normalized: Record<string, number>;
  positions_unrecognized: Record<string, number>;
  empty_rows_skipped: number;
  sheets_processed: number;
  records_per_sheet: Record<string, number>;
}

// ── Column Layout Detection ────────────────────────────────────────────────
type CellValue = string | number | boolean | null | undefined;

interface ColumnLayout {
  headerRowIndex: number;
  cols: { pollingStation: number; name: number; voterId: number; position: number; contact: number };
}

function detectColumnLayout(rows: CellValue[][]): ColumnLayout | null {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map((c: CellValue) => String(c || '').trim().toUpperCase());
    const nameIdx = row.findIndex((c: string) => c === 'NAME');
    const posIdx = row.findIndex((c: string) => c === 'POSITION');

    if (nameIdx >= 0 && posIdx >= 0) {
      const psIdx = row.findIndex((c: string) => c.includes('POLLING') || c.includes('STATION'));
      const vidIdx = row.findIndex((c: string) => c.includes('VOTER') || c === 'ID');
      const contactIdx = row.findIndex((c: string) => c === 'CONTACT');
      return {
        headerRowIndex: i,
        cols: { pollingStation: psIdx >= 0 ? psIdx : -1, name: nameIdx, voterId: vidIdx >= 0 ? vidIdx : -1, position: posIdx, contact: contactIdx >= 0 ? contactIdx : -1 },
      };
    }
  }
  return null;
}

function extractStationCode(text: string): string | null {
  const match = text.match(/[A-Z]?\d{5,7}\s*[A-Z0-9]*/i);
  return match ? match[0].trim().replace(/\s+/g, '') : null;
}

// ── Sheet Parsing ──────────────────────────────────────────────────────────
function parseSheet(sheetName: string, ws: XLSX.WorkSheet, report: ImportReport): ContactRecord[] {
  const rows: CellValue[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const records: ContactRecord[] = [];
  const subArea = sheetName.trim();
  const layout = detectColumnLayout(rows);

  let currentStation: string | null = null;
  let currentStationCode: string | null = null;
  let startRow = 0;

  const cols = layout
    ? layout.cols
    : { pollingStation: 0, name: 1, voterId: 2, position: 3, contact: 4 };

  if (layout) {
    startRow = layout.headerRowIndex + 1;
  } else {
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      if (rows[i].filter((c: CellValue) => String(c || '').trim()).length <= 1) startRow = i + 1;
      else break;
    }
  }

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c: CellValue) => !String(c || '').trim())) { report.empty_rows_skipped++; continue; }

    const stationCell = String(row[cols.pollingStation >= 0 ? cols.pollingStation : 0] || '').trim();
    const nameCell = String(row[cols.name] || '').trim();
    const voterIdCell = String(row[cols.voterId >= 0 ? cols.voterId : -1] || '').trim();
    const positionCell = String(row[cols.position] || '').trim();
    const contactCell = String(row[cols.contact >= 0 ? cols.contact : -1] || '').trim();

    if (stationCell) {
      if (!nameCell && !positionCell) { currentStation = stationCell; currentStationCode = extractStationCode(stationCell); report.empty_rows_skipped++; continue; }
      currentStation = stationCell;
      currentStationCode = extractStationCode(stationCell);
    }

    if (!nameCell && !positionCell) { report.empty_rows_skipped++; continue; }
    if (nameCell.toUpperCase() === 'NAME' || positionCell.toUpperCase() === 'POSITION') continue;
    if (!nameCell) { report.empty_rows_skipped++; continue; }

    const normalizedPosition = normalizePosition(positionCell);
    if (positionCell && normalizedPosition) {
      report.positions_normalized[positionCell] = (report.positions_normalized[positionCell] || 0) + 1;
    } else if (positionCell && !normalizedPosition) {
      report.positions_unrecognized[positionCell] = (report.positions_unrecognized[positionCell] || 0) + 1;
    }

    let phone: string | null = contactCell || null;
    if (phone) {
      phone = phone.replace(/[^\d+\/]/g, '').trim();
      if (phone.includes('/')) phone = phone.split('/')[0].trim();
      if (!phone) phone = null;
    }

    let voterId: string | null = voterIdCell || null;
    if (voterId?.match(/^[A-Z]\d{6}$/i)) {
      if (!currentStationCode) currentStationCode = voterId;
      voterId = null;
    }

    records.push({
      user_id: IMPORT_USER_ID,
      name: nameCell,
      phone: phone || null,
      group_name: `Constituency: ${subArea}`,
      voter_id: voterId || null,
      position: normalizedPosition || positionCell || null,
      polling_station: currentStation || null,
      polling_station_code: currentStationCode || null,
      sub_area: subArea,
      has_contact: !!phone,
      has_voter_id: !!voterId,
    });
  }
  return records;
}

// ── Duplicate Station Code Resolution ──────────────────────────────────────
function resolveDuplicateStationCodes(records: ContactRecord[], report: ImportReport): void {
  const codeToStations: Record<string, Set<string>> = {};
  for (const r of records) {
    if (r.polling_station_code && r.polling_station) {
      if (!codeToStations[r.polling_station_code]) codeToStations[r.polling_station_code] = new Set();
      codeToStations[r.polling_station_code].add(r.polling_station);
    }
  }
  const duplicated = Object.entries(codeToStations).filter(([, s]) => s.size > 1).map(([c]) => c);
  report.duplicated_station_codes = duplicated;

  for (const code of duplicated) {
    const stations = Array.from(codeToStations[code]);
    const suffixMap: Record<string, string> = {};
    stations.forEach((s, i) => { suffixMap[s] = `${code}-${String.fromCharCode(65 + i)}`; });
    for (const r of records) {
      if (r.polling_station_code === code && r.polling_station && suffixMap[r.polling_station]) {
        r.polling_station_code = suffixMap[r.polling_station];
      }
    }
  }
}

// ── Upsert ─────────────────────────────────────────────────────────────────
async function upsertRecords(records: ContactRecord[]): Promise<void> {
  const BATCH = 100;
  console.log(`📤 Upserting ${records.length} records into contacts table...`);
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('contacts').insert(batch);
    if (error) { console.error(`❌ Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message); throw error; }
    console.log(`   ✓ ${Math.min(i + BATCH, records.length)} / ${records.length}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CONCORD — Drybone Contact Import Pipeline');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(XLSX_PATH)) { console.error(`❌ File not found: ${XLSX_PATH}`); process.exit(1); }

  const report: ImportReport = {
    total_imported: 0, missing_contact: 0, missing_voter_id: 0,
    duplicated_station_codes: [], positions_normalized: {}, positions_unrecognized: {},
    empty_rows_skipped: 0, sheets_processed: 0, records_per_sheet: {},
  };

  console.log(`📂 Reading: ${XLSX_PATH}\n`);
  const workbook = XLSX.readFile(XLSX_PATH);
  const allRecords: ContactRecord[] = [];

  for (const sheetName of workbook.SheetNames) {
    console.log(`📋 Processing: "${sheetName}"`);
    const records = parseSheet(sheetName, workbook.Sheets[sheetName], report);
    allRecords.push(...records);
    report.sheets_processed++;
    report.records_per_sheet[sheetName] = records.length;
    console.log(`   → ${records.length} contacts`);
  }

  resolveDuplicateStationCodes(allRecords, report);
  report.total_imported = allRecords.length;
  report.missing_contact = allRecords.filter(r => !r.has_contact).length;
  report.missing_voter_id = allRecords.filter(r => !r.has_voter_id).length;

  console.log('\n── Summary ──');
  console.log(`  Total:    ${report.total_imported}`);
  console.log(`  No phone: ${report.missing_contact}`);
  console.log(`  No voter: ${report.missing_voter_id}`);
  console.log(`  Sheets:   ${report.sheets_processed}`);

  if (Object.keys(report.positions_unrecognized).length > 0) {
    console.log('\n⚠️  Unrecognized positions:');
    for (const [pos, n] of Object.entries(report.positions_unrecognized)) console.log(`     "${pos}" × ${n}`);
  }

  await upsertRecords(allRecords);

  const reportDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'drybone_import_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Report: ${reportPath}`);
  console.log('\n✅ Done!');
}

main().catch(err => { console.error('\n💥 Fatal:', err); process.exit(1); });

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually if it exists
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0]?.trim();
      const value = parts.slice(1).join('=').trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value.replace(/"/g, ''); // strip quotes if any
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IMPORT_USER_ID = process.env.IMPORT_USER_ID || '5754d355-35b2-43b6-bdb0-56af174d5065';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const XLSX_PATH = path.resolve('concord_npp_final.xlsx');

// ── Position Normalization Map ─────────────────────────────────────────────
const POSITION_MAP = {
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
  
  // Custom user-requested and newly identified mappings
  "women's organiser (previous)": "Women Organizer (Previous)",
  "communication / electoral aff.": "Communications Officer",
  "elec": "Electoral Affairs Officer",
  "wom": "Women Organizer",
  "elect": "Electoral Affairs Officer",
};

function normalizePosition(raw) {
  if (!raw?.trim()) return null;
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return POSITION_MAP[cleaned] || null;
}

// ── Types and Report Structure ─────────────────────────────────────────────
const report = {
  total_imported: 0,
  missing_contact: 0,
  missing_voter_id: 0,
  duplicated_station_codes: [],
  positions_normalized: {},
  empty_rows_skipped: 0,
  sheets_processed: 0,
  records_per_sheet: {},
};

// ── Column Layout Detection ────────────────────────────────────────────────
function detectColumnLayout(rows) {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map(c => String(c || '').trim().toUpperCase());
    const nameIdx = row.findIndex(c => c === 'NAME');
    const posIdx = row.findIndex(c => c === 'POSITION');

    if (nameIdx >= 0 && posIdx >= 0) {
      const psIdx = row.findIndex(c => c.includes('POLLING') || c.includes('STATION'));
      const vidIdx = row.findIndex(c => c.includes('VOTER') || c === 'ID' || c.includes('VOTER ID'));
      const contactIdx = row.findIndex(c => c === 'CONTACT' || c === 'CONTACTS' || c === 'PHONE');
      return {
        headerRowIndex: i,
        cols: {
          pollingStation: psIdx >= 0 ? psIdx : -1,
          name: nameIdx,
          voterId: vidIdx >= 0 ? vidIdx : -1,
          position: posIdx,
          contact: contactIdx >= 0 ? contactIdx : -1
        },
      };
    }
  }
  return null;
}

function extractStationCode(text) {
  const match = text.match(/[A-Z]?\d{5,7}\s*[A-Z0-9]*/i);
  return match ? match[0].trim().replace(/\s+/g, '') : null;
}

// ── Sheet Parsing ──────────────────────────────────────────────────────────
function parseSheet(sheetName, ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const records = [];
  const subArea = sheetName.trim();
  const layout = detectColumnLayout(rows);

  let currentStation = null;
  let currentStationCode = null;
  let startRow = 0;

  const cols = layout
    ? layout.cols
    : { pollingStation: 0, name: 1, voterId: 2, position: 3, contact: 4 };

  if (layout) {
    startRow = layout.headerRowIndex + 1;
  } else {
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      if (rows[i].filter(c => String(c || '').trim()).length <= 1) startRow = i + 1;
      else break;
    }
  }

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !String(c || '').trim())) { report.empty_rows_skipped++; continue; }

    const stationCell = String(row[cols.pollingStation >= 0 ? cols.pollingStation : 0] || '').trim();
    const nameCell = String(row[cols.name] || '').trim();
    const voterIdCell = String(row[cols.voterId >= 0 ? cols.voterId : -1] || '').trim();
    const positionCell = String(row[cols.position] || '').trim();
    const contactCell = String(row[cols.contact >= 0 ? cols.contact : -1] || '').trim();

    if (stationCell) {
      if (!nameCell && !positionCell) {
        currentStation = stationCell;
        currentStationCode = extractStationCode(stationCell);
        report.empty_rows_skipped++;
        continue;
      }
      currentStation = stationCell;
      currentStationCode = extractStationCode(stationCell);
    }

    if (!nameCell && !positionCell) { report.empty_rows_skipped++; continue; }
    if (nameCell.toUpperCase() === 'NAME' || positionCell.toUpperCase() === 'POSITION') continue;
    if (!nameCell) { report.empty_rows_skipped++; continue; }

    const normalizedPosition = normalizePosition(positionCell);
    if (positionCell) {
      const finalPosName = normalizedPosition || positionCell;
      report.positions_normalized[finalPosName] = (report.positions_normalized[finalPosName] || 0) + 1;
    }

    let phone = contactCell || null;
    if (phone) {
      phone = phone.replace(/[^\d+\/]/g, '').trim();
      if (phone.includes('/')) phone = phone.split('/')[0].trim();
      if (!phone) phone = null;
    }

    let voterId = voterIdCell || null;
    // Handle edge case where voter ID matches station code format
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
function resolveDuplicateStationCodes(records) {
  const codeToStations = {};
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
    const suffixMap = {};
    stations.forEach((s, i) => { suffixMap[s] = `${code}-${String.fromCharCode(65 + i)}`; });
    for (const r of records) {
      if (r.polling_station_code === code && r.polling_station && suffixMap[r.polling_station]) {
        r.polling_station_code = suffixMap[r.polling_station];
      }
    }
  }
}

// ── Database Operations ────────────────────────────────────────────────────
async function clearDatabaseContacts() {
  console.log('🗑️  Clearing all existing contacts from contacts table...');
  const { error } = await supabase
    .from('contacts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows

  if (error) {
    console.error('❌ Failed to clear database contacts:', error.message);
    throw error;
  }
  console.log('✓ Database contacts cleared successfully.');
}

async function upsertRecords(records) {
  const BATCH = 100;
  console.log(`📤 Seeding ${records.length} records into contacts table...`);
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('contacts').insert(batch);
    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message);
      throw error;
    }
    console.log(`   ✓ ${Math.min(i + BATCH, records.length)} / ${records.length}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CONCORD — Final Seed Migration Pipeline');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ Excel file not found: ${XLSX_PATH}`);
    process.exit(1);
  }

  console.log(`📂 Reading Excel workbook: ${XLSX_PATH}`);
  const buffer = fs.readFileSync(XLSX_PATH);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const allRecords = [];

  for (const sheetName of workbook.SheetNames) {
    console.log(`📋 Processing sheet: "${sheetName}"`);
    const records = parseSheet(sheetName, workbook.Sheets[sheetName]);
    allRecords.push(...records);
    report.sheets_processed++;
    report.records_per_sheet[sheetName] = records.length;
    console.log(`   → ${records.length} valid contacts extracted`);
  }

  resolveDuplicateStationCodes(allRecords);
  report.total_imported = allRecords.length;
  report.missing_contact = allRecords.filter(r => !r.has_contact).length;
  report.missing_voter_id = allRecords.filter(r => !r.has_voter_id).length;

  console.log('\n── Extraction Summary ──');
  console.log(`  Total Extracted:   ${report.total_imported}`);
  console.log(`  Missing Phone:     ${report.missing_contact}`);
  console.log(`  Missing Voter ID:  ${report.missing_voter_id}`);
  console.log(`  Sheets Processed:  ${report.sheets_processed}`);

  // Clear table first
  await clearDatabaseContacts();

  // Seeding
  await upsertRecords(allRecords);

  const reportDir = path.resolve('reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'drybone_import_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Data quality report saved: ${reportPath}`);
  console.log('\n✅ Database migration completed successfully!');
}

main().catch(err => {
  console.error('\n💥 Fatal Error during migration:', err);
  process.exit(1);
});

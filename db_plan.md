# Concord SMS Platform — Contact Data Restructuring & Group Switcher Module

**Prepared by:** PhiNova  
**Date:** 19th May, 2026  
**Engine:** Concord SMS  
**For:** Coding Agent

-----

## Project Context

You are building a module for the **Concord SMS Engine**, a bulk SMS platform developed by PhiNova. The platform stack is:

|Layer      |Technology                                        |
|-----------|--------------------------------------------------|
|Frontend   |Next.js + Tailwind CSS                            |
|Backend    |Node.js + Express.js (Vercel serverless functions)|
|Database   |Supabase (PostgreSQL)                             |
|Auth       |Supabase Auth                                     |
|Scheduler  |Supabase Edge Functions                           |
|SMS Gateway|Arkesel API                                       |
|Hosting    |Vercel                                            |


> Do not use Python anywhere. All parsing must use SheetJS. All database interaction must use `@supabase/supabase-js`. All styling must use Tailwind utility classes only — no custom CSS files.

-----

## Task 1 — Data Import & Parsing Pipeline

Build a one-time data import script (`scripts/importDrybone.js`) that:

1. Reads `MASTER_DRYBONE.xlsx` using **SheetJS (`xlsx`)**
1. Iterates all 13 sheets, parsing each row into a normalized contact record
1. Handles these structural quirks:
- Polling station name and code appear on a row above the members that belong to them — carry both forward until the next station row appears
- Some sheets use abbreviated column headers (e.g., `W. ORG`, `COMM`, `ELECTIONS`) — map them to canonical names
1. Normalizes all position variants to one of these canonical labels:

```
Chairman | Secretary | Organizer | Women Organizer |
Youth Organizer | Communications Officer | Electoral Affairs Officer
```

**Normalization map (case-insensitive):**

```
CHAIRMAN / CHAIRPERSON                                        → Chairman
SECRETARY                                                     → Secretary
ORGANIZER / ORGANISER                                         → Organizer
WOMEN / WOMAN / W. ORG / WOMEN ORGANIZER / WOMAN ORGANISER   → Women Organizer
YOUTH / Y. ORG / YOUTH ORGANIZER / YOUTH ORGANISER           → Youth Organizer
COMMS / COMM / COMMUNICATION / COMMUNICATIONS /
  COMMS OFFICER / COMMUNICATION OFFICER / COMMINUCATION       → Communications Officer
ELECTORAL / ELECTIONS / ELRCTIONS / ELECTORAL OFFICER /
  ELECTORAL AFFAIRS / ELECTORAL AFFAIRS OFFICER               → Electoral Affairs Officer
```

1. Resolves duplicate polling station codes by appending a suffix: `C021002` → `C021002-A`, `C021002-B`
1. Skips empty rows, header rows, and label-only rows
1. Flags records with missing contact or voter ID — include them but set `has_contact: false` / `has_voter_id: false`
1. Upserts all records into Supabase using the `@supabase/supabase-js` client

-----

## Task 2 — Supabase Database Schema

Create this table via a Supabase migration file (`supabase/migrations/001_contacts.sql`):

```sql
CREATE TABLE contacts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  voter_id             TEXT,
  contact              TEXT,
  position             TEXT,
  polling_station      TEXT,
  polling_station_code TEXT,
  sub_area             TEXT,
  has_contact          BOOLEAN DEFAULT false,
  has_voter_id         BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast group filtering
CREATE INDEX idx_contacts_sub_area         ON contacts(sub_area);
CREATE INDEX idx_contacts_position         ON contacts(position);
CREATE INDEX idx_contacts_polling_station  ON contacts(polling_station_code);
CREATE INDEX idx_contacts_has_contact      ON contacts(has_contact);
```

-----

## Task 3 — Express API Endpoints

Create the following routes in `server/routes/contacts.js`:

```
GET  /api/contacts              — All contacts (paginated)
GET  /api/contacts/groups       — Returns all available group options
GET  /api/contacts/filter       — Filter by any combination of query params:
                                    ?sub_area=GBAWE+WEST
                                    &position=Chairman
                                    &polling_station_code=C021007
                                    &has_contact=true
                                    &search=Philip
GET  /api/contacts/stats        — Returns counts: total, with_contact,
                                    without_contact, sub_areas, stations
```

The `/filter` endpoint must support combining all parameters simultaneously and return:

```json
{
  "count": 12,
  "contacts": [
    {
      "id": "",
      "name": "",
      "position": "",
      "sub_area": "",
      "polling_station": "",
      "contact": "",
      "has_contact": true
    }
  ]
}
```

-----

## Task 4 — Contact Selection UI Component

Build `components/ContactSelector.jsx` as a full-page Next.js component using Tailwind CSS. It must include:

### A. Group Switcher Panel

A multi-level filter system:

- **Level 1 tabs:** `All Members` | `By Sub-Area` | `By Position` | `By Polling Station` | `Smart Filters`
- **Level 2 (contextual dropdown/list):**
  - Sub-Area → list all 13 sub-areas
  - Position → list all 7 canonical roles
  - Polling Station → searchable dropdown of all stations
  - Smart Filters → predefined options: `Missing Contact`, `Missing Voter ID`, `Chairmen Only`, `Full Stations` (stations with all 7 roles present)
- **Level 3 (optional cross-filter):** When a sub-area is selected, show a secondary filter to further narrow by position within that sub-area, and vice versa

Each selection triggers a live API call to `/api/contacts/filter` and updates the contact list instantly.

### B. Contact List Panel

- Displays filtered contacts in a table: Name | Position | Sub-Area | Polling Station | Contact Number | Status
- Rows with missing contact highlighted with an amber left border and a `⚠ No Contact` badge
- Checkbox on each row for individual selection
- `Select All in Group` toggle at the top
- Live count: `X of Y selected`

### C. Filter Chips Bar

Active filters shown as dismissible chips above the table:

```
[Sub-Area: GBAWE WEST ×]  [Position: Chairman ×]  [Has Contact only ×]
```

### D. Summary Stats Bar

Always visible at the top or bottom:

```
Total Selected: 24  |  With Contact: 21  |  Missing Contact: 3  |  Sub-Areas: 3  |  Stations: 8
```

### E. Search Bar

Free-text search (debounced 300ms) across name, polling station, and sub-area — hits `/api/contacts/filter?search=`.

### F. Exclude Missing Contacts Toggle

A toggle switch labelled `Exclude contacts without phone numbers`. When ON, automatically deselects and greys out all records where `has_contact = false`.

-----

## Task 5 — SMS Integration Hook

Expose this function from the component:

```javascript
// Returns array ready for Arkesel bulk SMS dispatch
function getSelectedContacts() {
  return selectedContacts
    .filter(c => c.has_contact)
    .map(c => ({
      name: c.name,
      phone: c.contact,
      position: c.position,
      sub_area: c.sub_area
    }));
}
```

Wire a **Send SMS** button that calls `getSelectedContacts()` and passes the result to the existing Arkesel send module. The button must be disabled if 0 contacts are selected or if 0 have valid contact numbers.

-----

## Task 6 — Data Quality Report

After the import script runs, auto-generate and save `reports/drybone_import_report.json` with the following structure:

```json
{
  "total_imported": 0,
  "missing_contact": 0,
  "missing_voter_id": 0,
  "duplicated_station_codes": [],
  "positions_normalized": {},
  "empty_rows_skipped": 0,
  "sheets_processed": 0
}
```

-----

## Deliverables

|#|File                                  |Description                          |
|-|--------------------------------------|-------------------------------------|
|1|`scripts/importDrybone.js`            |Import and normalization pipeline    |
|2|`supabase/migrations/001_contacts.sql`|Database schema and indexes          |
|3|`server/routes/contacts.js`           |Express API routes                   |
|4|`components/ContactSelector.jsx`      |Full contact selection UI component  |
|5|`reports/drybone_import_report.json`  |Auto-generated after import completes|

-----

*Concord SMS Engine · PhiNova · May 2026*
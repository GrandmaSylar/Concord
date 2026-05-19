# Drybone Contact Data — Import Report

**Prepared by:** PhiNova  
**Date:** 19th May 2026  
**Platform:** Concord SMS  

---

## Overview

The **MASTER DRYBONE** spreadsheet containing constituency contact records has been fully processed and loaded into the Concord SMS platform. All **13 sub-areas** were imported successfully.

---

## What Was Imported

| Sub-Area | Contacts Loaded |
|----------|----------------|
| GBAWE WEST | 78 |
| GBAWE EAST | 127 |
| NEW WEIJA WEST | 204 |
| TETEGU | 98 |
| GONSE | 70 |
| OBLOGO | 97 |
| MCCARTHY SOUTH | 59 |
| DJAMAN | 95 |
| NEW WEIJA EAST | 218 |
| NEW GBAWE | 125 |
| MALLAM WEST | 152 |
| MALLAM EAST | 67 |
| MCCARTHY NORTH | 105 |
| **Total** | **1,495** |

---

## Data Quality Summary

| Metric | Count |
|--------|-------|
| Total contacts loaded | 1,495 |
| Contacts **with** phone numbers | 1,328 |
| Contacts **without** phone numbers | 167 |
| Contacts with Voter ID on file | 975 |
| Contacts without Voter ID | 520 |
| Empty or label-only rows skipped | 422 |

> 167 contacts have no phone number on record. These contacts are still in the system and can be viewed, but they cannot receive SMS messages until a phone number is added.

---

## How Positions Were Standardized

The spreadsheet contained over **55 different spellings** for just 7 roles. Every variation was mapped to a single, clean label to make filtering and searching reliable.

### The 7 Standard Roles

| Standard Role | What was found in the spreadsheet (examples) |
|--------------|----------------------------------------------|
| **Chairman** | CHAIRMAN, CHAIRPERSON, CHAIR |
| **Secretary** | SECRETARY |
| **Organizer** | ORGANIZER, ORGANISER, ORG |
| **Women Organizer** | WOMEN, WOMAN, W. ORG, W. ORG., WOMEN ORGANIZER, WOMAN ORGANISER, WOMEN'S ORGANISER, WOMEN ORG, W. ORGANIZER, W / ORGANIZER, ORGANIZER WOMEN, WOMEN PRGANIZER |
| **Youth Organizer** | YOUTH, Y. ORG, Y. ORG., Y ORG, YOUTH ORG, YOUTH ORGANIZER, YOUTH ORGANISER, Y. ORGANIZER, Y ORGANIZER, Y / ORGANIZER, ORGANIZER YOUTH |
| **Communications Officer** | COMM, COMMS, COMM., COMMUNICATION, COMMUNICATIONS, COMMS OFFICER, COMMUNICATION OFFICER, COMMUNICATION'S OFFICER, COMMINUCATION, COMM ELECTORAL, COMMUNICATIONS ELECTORAL |
| **Electoral Affairs Officer** | ELECTORAL, ELECTIONS, ELECTION, ELECTORAL AFFAIRS, ELECTORAL A, ELECTORAL AFFAIRS OFFICER, ELECTORAL OFFICER, ELECTORIAL OFFICER, ELRCTIONS, ELCTORAL AFFAIRS, ELECTORAL AFF, ELECTORAL AFFAIRS OFF., E. AFFAIRS, AFFAIRS, AFFAIRS OFFICER |

### Special Cases

Three types of entries did not fit neatly into the 7 standard roles. Here is how each was handled:

| Entry | Count | Decision |
|-------|-------|----------|
| **TRANSFEREE** | 5 | These are members who transferred into the area. They are not officeholders, so no role was assigned. They remain in the system as general contacts. |
| **WOMEN'S ORGANISER (PREVIOUS)** | 1 | This person previously held the Women Organizer role. The role was recorded as **Women Organizer** since it reflects the position they are known by. |
| **COMMUNICATION / ELECTORAL AFF.** | 1 | This person appears to fill two roles. The primary role was recorded as **Communications Officer**. |

---

## How Polling Stations Were Handled

Each sub-area's spreadsheet tab listed polling stations in a specific way — the station name (and sometimes a code like **C020402**) appeared on a row above the members who belong to that station. The system correctly carried each station name forward to all members listed below it until the next station appeared.

### Duplicate Station Codes

Two station codes appeared more than once across different stations:

| Code | What happened |
|------|--------------|
| **C021201** | Used by two different stations — the system added a suffix to distinguish them (C021201-A, C021201-B) |
| **C021205** | Same treatment — split into C021205-A, C021205-B |

This ensures every polling station can be uniquely identified and filtered.

---

## What Was Skipped

- **422 rows** were skipped because they were either empty, contained only a sub-area title, or were header labels (column titles like "NAME", "POSITION", etc.)
- No valid contact data was lost

---

## How the Data Can Be Used

All 1,495 contacts are now available on the **Constituency** page in Concord SMS, where you can:

- **Filter by sub-area** — view contacts from any of the 13 areas
- **Filter by role** — e.g., show only Chairmen, only Secretaries, etc.
- **Filter by polling station** — narrow down to a specific station
- **Search by name** — find any contact quickly
- **Exclude contacts without phone numbers** — toggle to show only those who can receive SMS
- **Select contacts and send SMS** — pick individuals, groups, or entire sub-areas for targeted campaigns

---

*Concord SMS · PhiNova · May 2026*

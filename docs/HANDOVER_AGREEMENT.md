# Concord Bulk SMS Platform — Official Handover Agreement

---

**Document Reference:** PHN/CONCORD/HANDOVER/2026-001  
**Effective Date:** July 1, 2026  
**Prepared By:** PhiNova Technologies  
**Prepared For:** Weija-Gbawe Constituency NPP Campaign Team  
**Platform Version:** Concord v1.0 (Production Release)  
**Document Classification:** Confidential — Client Eyes Only

---

## 1. Parties

| Role | Details |
|------|---------|
| **Service Provider** | **PhiNova Technologies** ("PhiNova", "We", "Us") |
| **Client** | **Weija-Gbawe Constituency NPP Campaign Team** ("Client", "You") |
| **Platform** | Concord Bulk SMS Platform v1.0 ("The System", "The Platform") |

---

## 2. Purpose of This Document

This document constitutes the official handover of the **Concord Bulk SMS Platform** from PhiNova Technologies to the Client. It formalizes the transfer of system access, outlines ownership terms, defines support obligations, and establishes the policies governing the use, data integrity, and redeployment of the platform.

By accepting the login credentials provided herein and continuing to use the platform, the Client acknowledges that they have read, understood, and agreed to all terms and conditions set forth in this agreement.

---

## 3. System Handover Summary

### 3.1 What Is Being Delivered

The following components are included in this handover:

| Component | Description |
|-----------|-------------|
| **Web Application** | Fully deployed Next.js application hosted on Vercel |
| **Database** | Dedicated Supabase PostgreSQL instance with Row-Level Security (RLS) |
| **Contact Database** | 1,497 curated constituent records across 13 sub-areas |
| **SMS Gateway Integration** | Pre-configured Arkesel API connection with registered Sender IDs |
| **Custom Branding** | White-label portal configured with campaign branding, colors, and watermarks |
| **AI Outreach Assistant** | Integrated AI-powered message drafting assistant |
| **Campaign Calendar** | Scheduled SMS and campaign calendar management system |
| **Documentation** | Complete system documentation and end-user manual |

### 3.2 Platform Access URL

| Environment | URL |
|-------------|-----|
| **Production** | [https://concord-nine.vercel.app](https://concord-nine.vercel.app) |
| **Status** | ✅ Live and Operational |

---

## 4. Client Login Credentials

> [!CAUTION]
> These credentials are strictly confidential. Do not share them with unauthorized individuals. PhiNova is not responsible for any unauthorized access resulting from credential mismanagement by the Client.

### Account 1 — Rachael (Primary User)

| Field | Value |
|-------|-------|
| **Email** | `rachael@concord.com` |
| **Password** | `Concord123!` |
| **Role** | User |
| **Permissions** | Contact management, campaign sending, template creation, scheduled reminders, and reports (own records only)

### Account 2 — Ameyaw (User)

| Field | Value |
|-------|-------|
| **Email** | `ameyaw@concord.com` |
| **Password** | `Concord123!` |
| **Role** | User |
| **Permissions** | Contact management, campaign sending, template creation, scheduled reminders, and reports (own records only)

### Credential Security Guidelines

1. **Change your password** immediately after your first login via Supabase Auth settings.
2. **Do not store credentials** in plain text, shared documents, or messaging platforms.
3. PhiNova will **never** ask for your password. Any such request is fraudulent.
4. If you suspect unauthorized access, contact PhiNova immediately for credential rotation.

---

## 5. Terms of Ownership

### 5.1 Platform Ownership

Upon execution of this handover, the Client is granted **exclusive operational ownership** of the deployed instance of the Concord Bulk SMS Platform (v1.0). This includes:

- ✅ Full administrative control of the deployed application
- ✅ Exclusive ownership of all data stored within the platform's database
- ✅ The right to use, configure, and operate the platform for the Client's organizational purposes
- ✅ Access to all features included in the current production release

### 5.2 Intellectual Property

The Client acknowledges and agrees that:

- The **source code, architecture, design patterns, and underlying technology** of the Concord platform remain the exclusive intellectual property of **PhiNova Technologies**.
- This agreement grants a **usage license**, not a transfer of intellectual property rights.
- PhiNova retains the right to develop, modify, and deploy the Concord platform (or derivative works) for other clients, provided such deployments operate on **completely separate and independent infrastructure** and do not compromise the Client's data or service.

---

## 6. Database Security & Data Ownership

### 6.1 Data Sovereignty

The Client's database is:

- **Fully isolated** — hosted on a dedicated Supabase PostgreSQL instance
- **Secured with Row-Level Security (RLS)** — enforced on all core tables (`profiles`, `contacts`, `templates`, `messages`, `scheduled_reminders`)
- **Encrypted at rest and in transit** — via Supabase's built-in TLS/SSL encryption
- **Exclusively curated** for the Client — no other organization, entity, or third party has access to the Client's data

### 6.2 Data Ownership Declaration

All data within the platform — including but not limited to constituent records, message logs, templates, scheduled reminders, and campaign analytics — is the **sole and exclusive property of the Client**. PhiNova will not access, modify, share, sell, or transfer Client data without explicit written authorization from the Client, except as required for technical support operations mutually agreed upon.

---

## 7. Redeployment & Exclusivity Policy

> [!WARNING]
> **Critical Clause — Please Read Carefully**

### 7.1 Redeployment Restriction

If the Client requests or facilitates the **redeployment, redistribution, or cloning** of this specific platform instance to another organization, political party, campaign, or third-party entity:

- The Client's **entire database will be voided immediately** — all constituent records, message histories, templates, scheduled reminders, and campaign data will be **permanently and irreversibly deleted**.
- Platform access will be **revoked** and the Client's Vercel deployment will be decommissioned.
- This action is **automatic and non-negotiable** upon discovery or confirmation of unauthorized redeployment.

### 7.2 What Constitutes Redeployment

The following actions are considered violations of this clause:

- Sharing platform access credentials with a competing campaign or unrelated organization
- Requesting PhiNova to duplicate the system (including its data) for another entity
- Independently forking, copying, or hosting the platform's source code for third-party use
- Granting database-level access to unauthorized external parties

### 7.3 Permitted Use

The Client **may** freely:

- Add new users within their own organization (subject to PhiNova's user creation process)
- Import additional constituent data into their existing database
- Customize branding, templates, and campaign settings
- Use the platform across multiple devices and locations for their campaign operations

---

## 8. Support & Maintenance Terms

### 8.1 Complimentary Support Period

PhiNova will provide **free technical support and system modifications** from the effective date of this agreement through **July 31, 2026** (end of the current calendar month). This includes:

| Service | Covered Until July 31, 2026 |
|---------|:---------------------------:|
| New feature additions | ✅ Free |
| System configuration changes | ✅ Free |
| New user account creation | ✅ Free |
| Branding and styling updates | ✅ Free |
| Data imports and cleaning | ✅ Free |
| Template creation assistance | ✅ Free |
| General platform training | ✅ Free |

### 8.2 Bug Fixes, Flaws & System Issues

> [!IMPORTANT]
> **System bugs, flaws, errors, and technical issues are always covered — regardless of date.**

Any defect, malfunction, or unintended behavior in the platform that is attributable to PhiNova's development (not caused by Client misuse) will be **diagnosed and resolved at no charge**, with no time limitation. This includes:

- Application crashes or unresponsive pages
- Data corruption or loss caused by system errors
- SMS gateway integration failures (within PhiNova's control)
- Security vulnerabilities discovered in the platform
- Incorrect calculations, broken filters, or UI rendering errors

### 8.3 Post-Complimentary Period (From August 1, 2026)

After July 31, 2026, the following services will be subject to a **mutually agreed service fee**:

- New feature development and additions
- Major system architecture changes
- Additional user account provisioning
- Custom integrations with third-party systems
- Data migration to new platforms
- Performance optimization requests

PhiNova will provide a written quotation for any post-complimentary work before commencing. No charges will be incurred without the Client's prior written approval.

---

## 9. Service Level Commitments

| Metric | Commitment |
|--------|------------|
| **Platform Uptime** | 99.5% (subject to Vercel and Supabase SLAs) |
| **Critical Bug Response** | Within 24 hours |
| **Non-Critical Bug Response** | Within 72 hours |
| **Feature Request Response** | Within 5 business days |
| **Data Backup Frequency** | Automated daily backups via Supabase |

---

## 10. Limitation of Liability

- PhiNova shall not be held liable for **SMS delivery failures** caused by the Arkesel gateway, mobile network operators, or recipient device issues beyond PhiNova's control.
- PhiNova shall not be held liable for **data loss** resulting from the Client's unauthorized database modifications, credential sharing, or actions that bypass platform security controls.
- PhiNova's total aggregate liability under this agreement shall not exceed the total fees paid by the Client for the platform.

---

## 11. Termination

Either party may terminate this agreement by providing **30 days' written notice** to the other party. Upon termination:

- The Client will receive a **complete data export** of all records in CSV/JSON format.
- PhiNova will **decommission** the Vercel deployment and Supabase instance within 14 days of the termination effective date.
- All Client data will be **permanently deleted** from PhiNova's infrastructure within 30 days of termination, unless the Client requests an extension for data migration purposes.

---

## 12. Acceptance

By logging into the Concord Bulk SMS Platform using the credentials provided in **Section 4** of this document, the Client confirms:

- [x] Receipt of the platform in full working order
- [x] Understanding and acceptance of all terms, conditions, and policies herein
- [x] Acknowledgment of the redeployment restriction and its consequences
- [x] Agreement to the support and maintenance terms outlined in Sections 8 and 9

---

## 13. Contact Information

### PhiNova Technologies — Support Channels

| Channel | Details |
|---------|---------|
| **Primary Contact** | PhiNova Engineering Team |
| **Email** | support@phinova.dev |
| **WhatsApp/Telegram** | Available upon request |
| **Response Hours** | Monday – Saturday, 8:00 AM – 8:00 PM GMT |

---

<div align="center">

**Concord Bulk SMS Platform v1.0**  
*Built with precision by PhiNova Technologies*  
*© 2026 PhiNova Technologies. All rights reserved.*

</div>
